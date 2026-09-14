#!/usr/bin/env bash
# Run every wallet build through every suite on the connected phone.
#   ./sweep.sh                        # everything in builds.json against everything in scenarios.json
#   ./sweep.sh --build store          # only the builds a client would download
#   ./sweep.sh --wallet paradym       # one wallet, both builds
#   ./sweep.sh --suite eventos        # one suite
# Results land in results/<stamp>/, one text file per run plus summary.json.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STAMP="$(date +%Y-%m-%d-%H%M)"
OUT="${MATRIX_OUT:-$HERE/results/$STAMP}"
ONLY_BUILD=""
ONLY_WALLET=""
ONLY_SUITE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --build) ONLY_BUILD="$2"; shift 2 ;;
    --wallet) ONLY_WALLET="$2"; shift 2 ;;
    --suite) ONLY_SUITE="$2"; shift 2 ;;
    *) echo "unknown option $1"; exit 2 ;;
  esac
done

command -v adb >/dev/null || { echo "adb not on PATH"; exit 2; }
adb get-state >/dev/null 2>&1 || { echo "no device"; exit 2; }
mkdir -p "$OUT"

wallets=$(python3 -c "import json;print(' '.join(json.load(open('$HERE/builds.json'))['builds']))")
suites=$(python3 -c "import json;print(' '.join(k for k,v in json.load(open('$HERE/scenarios.json'))['suites'].items() if not v.get('skip')))")

echo "sweep $STAMP -> $OUT"
echo "wallets: $wallets"
echo "suites:  $suites"
echo

for wallet in $wallets; do
  [ -n "$ONLY_WALLET" ] && [ "$ONLY_WALLET" != "$wallet" ] && continue
  for build in fork store; do
    [ -n "$ONLY_BUILD" ] && [ "$ONLY_BUILD" != "$build" ] && continue

    cfg=$(python3 - "$HERE/builds.json" "$wallet" "$build" <<'PY'
import json,sys
b=json.load(open(sys.argv[1]))['builds'][sys.argv[2]].get(sys.argv[3])
if not b: print("MISSING"); raise SystemExit
if b.get('incompatible'): print("INCOMPATIBLE\t"+b['incompatible']); raise SystemExit
if b.get('skip'): print("SKIP\t"+b['skip']); raise SystemExit
print("\t".join(["OK", b.get('package',''), b.get('activity',''), b.get('unlock','none'), b.get('secret') or ""]))
PY
)
    state=$(cut -f1 <<<"$cfg")
    case "$state" in
      MISSING) echo "-- $wallet/$build: no such build"; continue ;;
      INCOMPATIBLE) echo "-- $wallet/$build: incompatible by design"; printf '%s\n' "$(cut -f2 <<<"$cfg")" > "$OUT/$wallet-$build.incompatible"; continue ;;
      SKIP) echo "-- $wallet/$build: skipped"; printf '%s\n' "$(cut -f2 <<<"$cfg")" > "$OUT/$wallet-$build.skip"; continue ;;
    esac

    pkg=$(cut -f2 <<<"$cfg")
    installed=$(adb shell pm list packages "$pkg" 2>/dev/null | tr -d '\r')
    if [ -z "$installed" ]; then
      echo "-- $wallet/$build: $pkg not installed"
      echo "not installed" > "$OUT/$wallet-$build.missing"
      continue
    fi
    version=$(adb shell dumpsys package "$pkg" 2>/dev/null | grep -m1 versionName | tr -d ' \r' | cut -d= -f2)
    installer=$(adb shell pm list packages -i "$pkg" 2>/dev/null | sed 's/.*installer=//' | tr -d '\r')

    for suite in $suites; do
      [ -n "$ONLY_SUITE" ] && [ "$ONLY_SUITE" != "$suite" ] && continue
      echo "== $wallet/$build ($version, from ${installer:-sideload}) x $suite"
      MATRIX_OUT="$OUT" \
      MATRIX_PACKAGE="$pkg" \
      MATRIX_ACTIVITY="$(cut -f3 <<<"$cfg")" \
      MATRIX_UNLOCK="$(cut -f4 <<<"$cfg")" \
      MATRIX_SECRET="$(cut -f5 <<<"$cfg")" \
      MATRIX_LABEL="$wallet-$build" \
      MATRIX_BUILD_VERSION="$version" \
      MATRIX_BUILD_INSTALLER="${installer:-sideload}" \
      "$HERE/run.sh" "$wallet" "$suite" 2>&1 | tee -a "$OUT/$wallet-$build-$suite.log"
      echo
    done
  done
done

python3 "$HERE/summarize.py" "$OUT" > "$OUT/summary.json" 2>/dev/null
echo "sweep done: $OUT"
