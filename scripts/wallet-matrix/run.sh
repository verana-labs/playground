#!/usr/bin/env bash
# Drive one wallet through one suite on a connected Android device.
#   ./run.sh <wallet> <suite> [scenario]
#   ./run.sh swiyu bhi
#   ./run.sh swiyu bhi halcyon
# See README.md for what the verdicts mean and how to add a wallet.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE="${PLAYGROUND_BASE:-https://playground.testnet.verana.network}"
OUT="${MATRIX_OUT:-$HERE/results}"
WALLET="${1:-}"
SUITE="${2:-}"
ONLY="${3:-}"

[ -z "$WALLET" ] || [ -z "$SUITE" ] && { sed -n '2,7p' "$0" | sed 's/^# \{0,1\}//'; exit 2; }
command -v adb >/dev/null || { echo "adb not on PATH"; exit 2; }
adb get-state >/dev/null 2>&1 || { echo "no device: connect the phone and enable USB debugging"; exit 2; }
mkdir -p "$OUT"

q() { python3 -c "import json,sys;d=json.load(open(sys.argv[1]));ks=sys.argv[2].split('.');
for k in ks:
    d=d[int(k)] if isinstance(d,list) else d.get(k)
    if d is None: print(''); raise SystemExit
print(d if not isinstance(d,(dict,list)) else json.dumps(d))" "$1" "$2" 2>/dev/null; }

PKG=$(q "$HERE/wallets.json" "wallets.$WALLET.package")
ACT=$(q "$HERE/wallets.json" "wallets.$WALLET.activity")
# sweep.sh drives the same wallet in more than one build (ours and the store's),
# which differ in package id and unlock, so the build wins over wallets.json.
PKG="${MATRIX_PACKAGE:-$PKG}"
ACT="${MATRIX_ACTIVITY:-$ACT}"
FMT=$(q "$HERE/wallets.json" "wallets.$WALLET.format")
PARAMS=$(q "$HERE/wallets.json" "wallets.$WALLET.demoParams")
UNLOCK=$(q "$HERE/wallets.json" "wallets.$WALLET.unlock")
UNLOCK="${MATRIX_UNLOCK:-$UNLOCK}"
SECRET=$(q "$HERE/wallets.json" "wallets.$WALLET.secret")
SECRET="${MATRIX_SECRET:-$SECRET}"
COLD=$(q "$HERE/wallets.json" "wallets.$WALLET.coldStart")
SKIP=$(q "$HERE/wallets.json" "wallets.$WALLET.skip")
[ -n "${MATRIX_PACKAGE:-}" ] && SKIP=""
LABEL="${MATRIX_LABEL:-$WALLET}"
# The state endpoints are per rail: an anoncreds exchange is invisible on the oid4vc rail.
RAIL="oid4vc"
[ "$FMT" = "anoncreds" ] && RAIL="anoncreds"

[ -n "$SKIP" ] && { echo "SKIP $WALLET: $SKIP"; exit 0; }
[ -z "$PKG" ] && { echo "unknown wallet '$WALLET'"; exit 2; }

SUITE_SKIP=$(q "$HERE/scenarios.json" "suites.$SUITE.skip")
[ -n "$SUITE_SKIP" ] && { echo "SKIP suite $SUITE: $SUITE_SKIP"; exit 0; }

ui() {
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null </dev/null 2>&1
  adb exec-out cat /sdcard/ui.xml </dev/null 2>/dev/null | python3 -c '
import sys,xml.etree.ElementTree as ET
try: t=ET.fromstring(sys.stdin.read())
except Exception: raise SystemExit
for n in t.iter("node"):
    lab=(n.get("text") or n.get("content-desc") or "").strip()
    if lab: print(lab)'
}

unlock() {
  for _ in 1 2 3 4 5; do
    local screen; screen="$(ui)"
    case "$UNLOCK" in
      password)
        grep -q "enter your password" <<<"${screen,,}" || return 0
        adb shell input tap 540 590 </dev/null; sleep 1
        adb shell input text "$SECRET" </dev/null; sleep 1
        adb shell input keyevent 111 </dev/null; sleep 1
        adb shell input tap 540 1439 </dev/null; sleep 12 ;;
      passcode)
        if grep -qi "fingerprint sensor" <<<"$screen"; then adb shell input tap 188 2268 </dev/null; sleep 3
        elif grep -qi "unlockApplication" <<<"$screen"; then adb shell input tap 540 2235 </dev/null; sleep 3
        elif grep -qi "enter your passcode" <<<"$screen"; then
          for k in 8 9 10 11 12 13; do adb shell input keyevent $k </dev/null; sleep 0.5; done; sleep 8; return 0
        else return 0; fi ;;
      device-credential)
        # Hologram-based builds gate launch behind the system biometric prompt, which is
        # FLAG_SECURE: uiautomator reads nothing, so drive it blind through "Use PIN".
        adb shell dumpsys window </dev/null 2>/dev/null | grep -q BiometricPrompt || return 0
        adb shell input tap 198 2268 </dev/null; sleep 1
        adb shell input text "$SECRET" </dev/null; sleep 1
        adb shell input keyevent 66 </dev/null; sleep 6; return 0 ;;
      keypad6-1234)
        # Paradym's store build draws its own keypad: digits 1-6 in two rows, and it
        # takes no injected text, only taps.
        grep -qiE "PIN" <<<"$screen" || return 0
        for c in "150 1610" "542 1610" "945 1610" "150 1824" "542 1824" "945 1824"; do
          adb shell input tap $c </dev/null; sleep 0.4; done; sleep 10; return 0 ;;
      keypad6)
        grep -qiE "passcode|PIN code|PIN" <<<"$screen" || return 0
        for c in "266 1218" "540 1218" "814 1218" "266 1492" "540 1492" "814 1492"; do
          adb shell input tap $c </dev/null; sleep 0.4; done; sleep 14; return 0 ;;
      pinfield)
        grep -qi "provide your PIN" <<<"$screen" || return 0
        adb shell input tap 510 1029 </dev/null; sleep 1
        for k in 8 9 10 11 12 13; do adb shell input keyevent $k </dev/null; sleep 0.5; done; sleep 14; return 0 ;;
      *) return 0 ;;
    esac
  done
}

# The overall verdict is a standalone line; per-block notes like "Service claims
# not verified" are sentences and must not be mistaken for it.
# Screen-change poll: returns as soon as two consecutive dumps match, or after N tries.
settle() {
  local tries="${1:-6}" previous="" current=""
  for _ in $(seq 1 "$tries"); do
    current="$(ui | head -40)"
    [ -n "$current" ] && [ "$current" = "$previous" ] && return 0
    previous="$current"
    sleep 1.5
  done
}

classify() {
  local screen="$1"
  local trust="?" perm="?"
  grep -qiE 'invalid credential|something went wrong|unexpected error|oups|cannot be added' <<<"$screen" && { echo "ERROR/-"; return; }
  grep -qxE '[[:space:]]*UNTRUSTED[[:space:]]*' <<<"$screen" && trust="UNTRUSTED"
  grep -qiE 'low level of trust|COULD NOT VERIFY' <<<"$screen" && trust="UNTRUSTED"
  [ "$trust" = "?" ] && grep -qxE '[[:space:]]*TRUSTED[[:space:]]*' <<<"$screen" && trust="TRUSTED"
  [ "$trust" = "?" ] && grep -qiE 'is a trusted party' <<<"$screen" && trust="TRUSTED"
  grep -qiE 'is not an authorized|no (issuer|verifier) permission|could not be matched|could not be checked' <<<"$screen" && perm="DENIED"
  [ "$perm" = "?" ] && grep -qiE 'is an authorized' <<<"$screen" && perm="GRANTED"
  local flag=""
  grep -qiE 'claims not verified' <<<"$screen" && flag=" selfissued"
  echo "$trust/$perm$flag"
}

run_one() {
  local sid="$1" svc="$2" cred="$3" extra="$4" expect="$5"
  local qs="format=$FMT"
  [ -n "$cred" ] && [ "$cred" != "null" ] && qs="$qs&credential=$cred"
  [ -n "$extra" ] && [ "$extra" != "null" ] && qs="$qs&$extra"
  [ -n "$PARAMS" ] && qs="$qs&$PARAMS"

  curl -sS -m 30 "$BASE/api/demo/$svc?$qs" -o /tmp/matrix-mint.json 2>/dev/null
  local url; url=$(q /tmp/matrix-mint.json url)
  if [ -z "$url" ] || [ "$url" = "null" ]; then
    printf '%-26s %-10s %s\n' "$sid" "MINT-FAIL" "$(head -c 120 /tmp/matrix-mint.json)"
    return
  fi
  local proof issuance
  proof=$(q /tmp/matrix-mint.json verificationSessionId); [ -z "$proof" ] && proof=$(q /tmp/matrix-mint.json proofExchangeId)
  issuance=$(q /tmp/matrix-mint.json issuanceSessionId); [ -z "$issuance" ] && issuance=$(q /tmp/matrix-mint.json credentialExchangeId)

  [ "$COLD" = "True" ] || [ "$COLD" = "true" ] && { adb shell am force-stop "$PKG" </dev/null; sleep 3; }
  adb logcat -c </dev/null 2>/dev/null
  adb shell am start -W -a android.intent.action.VIEW -d "'$url'" -n "$PKG/$ACT" </dev/null >/dev/null 2>&1
  # Wait for the wallet to show something rather than for a fixed count: most scenarios settle in
  # a couple of seconds, and the fixed sleeps were the whole cost of a sweep.
  settle 6
  unlock
  settle 8

  local screen verdict server
  screen="$(ui)"
  verdict="$(classify "$screen")"
  server="-"
  if [ -n "$proof" ]; then
    server=$(curl -sS -m 20 "$BASE/api/demo/$svc/proof/$proof?rail=$RAIL" 2>/dev/null | python3 -c 'import json,sys;d=json.load(sys.stdin);print(d.get("state","?"))' 2>/dev/null)
  elif [ -n "$issuance" ]; then
    server=$(curl -sS -m 20 "$BASE/api/demo/$svc/credential/$issuance?rail=$RAIL" 2>/dev/null | python3 -c 'import json,sys;d=json.load(sys.stdin);print(d.get("state","?"))' 2>/dev/null)
  fi

  # OfferCreated/RequestCreated means the wallet never fetched the payload, so
  # whatever is on screen belongs to the previous scenario. Reporting its verdict
  # produces a confident wrong answer, which is the one thing this runner must not do.
  case "$server" in
    OfferCreated|RequestCreated) verdict="NOT-DELIVERED" ;;
  esac

  printf '%-26s expect=%-7s screen=%-18s server=%s\n' "$sid" "$expect" "$verdict" "$server"
  { echo "### $LABEL / $SUITE / $sid  (expect $expect) pkg=$PKG version=${MATRIX_BUILD_VERSION:-?}"
    echo "screen verdict: $verdict"
    echo "server state:   $server"
    echo "--- screen text ---"
    echo "$screen"
    echo; } >> "$OUT/$LABEL-$SUITE.txt"
}

echo "wallet=$LABEL suite=$SUITE format=$FMT params=${PARAMS:-none} pkg=$PKG version=${MATRIX_BUILD_VERSION:-?} installer=${MATRIX_BUILD_INSTALLER:-?}"
: > "$OUT/$LABEL-$SUITE.txt"

count=$(python3 -c "import json;print(len(json.load(open('$HERE/scenarios.json'))['suites']['$SUITE']['scenarios']))")
for i in $(seq 0 $((count - 1))); do
  sid=$(q "$HERE/scenarios.json" "suites.$SUITE.scenarios.$i.id")
  [ -n "$ONLY" ] && [ "$ONLY" != "$sid" ] && continue
  svc=$(q "$HERE/scenarios.json" "suites.$SUITE.scenarios.$i.service")
  [ -z "$svc" ] && { printf '%-26s %s\n' "$sid" "SKIP (login route, drive it from the page)"; continue; }
  cred=$(q "$HERE/scenarios.json" "suites.$SUITE.scenarios.$i.credential")
  extra=$(q "$HERE/scenarios.json" "suites.$SUITE.scenarios.$i.extra")
  expect=$(q "$HERE/scenarios.json" "suites.$SUITE.scenarios.$i.expect")
  run_one "$sid" "$svc" "$cred" "$extra" "$expect"
done

echo
echo "screen text saved to $OUT/$WALLET-$SUITE.txt"
