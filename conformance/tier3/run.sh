#!/usr/bin/env bash
set -uo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
OUT="${TIER3_OUT:-$HERE/out}"
PROFILES="$HERE/../profiles"
NETWORKS="$HERE/../networks.yaml"
SCENARIOS="$HERE/../scenarios.yaml"
WORKFLOWS="$HERE/../../.github/workflows"
RESULTS="$HERE/../results"
WALLET=${WALLET:?set WALLET to a profile id}
NETWORK_ID=${CONFORMANCE_NETWORK:?set CONFORMANCE_NETWORK to a network id from networks.yaml}
RUN_ID=${CONFORMANCE_RUN_ID:-local}
DEVICE_PIN=${TIER3_DEVICE_PIN:-132006}
STARTED=$(date -u +%Y-%m-%dT%H:%M:%SZ)
COMPLETED=" "
mkdir -p "$OUT"

profile="$PROFILES/$WALLET.yaml"
if [[ ! $WALLET =~ ^[a-z0-9-]+$ || ! -f $profile ]]; then
  echo "no profile $profile"
  exit 1
fi

PLAN="$OUT/plan.json"
python3 "$HERE/suite.py" resolve <(yq -o=json . "$NETWORKS") <(yq -o=json . "$profile") <(yq -o=json . "$SCENARIOS") \
  "$WORKFLOWS" "$NETWORK_ID" "$WALLET" > "$PLAN" || exit 1
python3 "$HERE/suite.py" show "$PLAN"
[[ ${TIER3_DRY_RUN:-0} == 1 ]] && exit 0

plan() { python3 "$HERE/suite.py" get "$PLAN" "$1"; }
steps_of() { python3 "$HERE/suite.py" steps "$PLAN" "build.$1"; }
runs() { python3 "$HERE/suite.py" runs "$PLAN"; }

CELLS="$OUT/cells.jsonl"
python3 "$HERE/suite.py" cells "$PLAN" > "$CELLS"

finish() {
  python3 "$HERE/suite.py" results "$CELLS" "$RESULTS" "$RUN_ID" "$NETWORK_ID" "$WALLET" "$STARTED"
  exit "$1"
}

[[ -z $(runs) ]] && finish 0

BASE=$(plan playground)
PKG=$(plan build.package)
BUILD_KIND=$(plan build.kind)
BUILD_VERSION=$(plan build.version)
SECRET=$(plan build.secret)
COLD=$(plan build.coldStart)
DELIVERY=$(plan build.delivery)
SIGNER=$(plan build.signerSha256)
APK_URL=$(plan build.obtain)

log() { echo "[$(date +%T)] $*" | tee -a "$OUT/probe.log"; }
json() { python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); print(next((d[k] for k in sys.argv[2:] if d.get(k)), ""))' "$@" 2> /dev/null; }

record() {
  CELL_NETWORK="$NETWORK_ID" CELL_CAST="$1" CELL_SERVICE="$2" CELL_WALLET="$WALLET" CELL_BUILD="$BUILD_KIND" \
  CELL_SCENARIO="$3" CELL_OUTCOME="$4" CELL_CAUSE="$5" CELL_VERSION="$BUILD_VERSION" CELL_DELIVERY="$DELIVERY" \
  CELL_STATE="${6:-}" CELL_GATE="${7:-}" CELL_HANDLERS="${8:-}" CELL_SCREENSHOT="${9:-}" \
    python3 "$HERE/suite.py" cell "$CELLS"
}

abandon() {
  local code=$1 cause=$2 name _kind _flow _expect cast service _rest
  log "$cause"
  while IFS=$'\x1f' read -r name _kind _flow _expect cast service _rest; do
    record "$cast" "$service" "$name" unknown "$cause"
  done < <(runs)
  finish "$code"
}

capture() {
  rm -f "$OUT/$1.xml" "$OUT/$1.png"
  adb exec-out screencap -p > "$OUT/$1.png"
  adb shell uiautomator dump /sdcard/ui.xml > /dev/null 2>&1 && adb exec-out cat /sdcard/ui.xml > "$OUT/$1.xml"
}

type_secret() {
  if [[ $1 =~ ^[0-9]+$ ]]; then
    for ((i = 0; i < ${#1}; i++)); do adb shell input keyevent $((7 + ${1:i:1})); done
  else
    adb shell input text "$1"
  fi
}

tap_label() {
  local name=$1 wanted=$2 x y
  capture "$name"
  read -r x y <<< "$(python3 "$HERE/screen.py" "$OUT/$name.xml" find "$wanted" 2> /dev/null)"
  if [[ -z $x || $x == none ]]; then
    log "$name: no '$wanted' on screen"
    return 1
  fi
  adb shell input tap "$x" "$y"
  sleep 3
}

show_qr() {
  python3 -c 'import sys, qrcode, qrcode.image.pure; qrcode.make(sys.argv[1], image_factory=qrcode.image.pure.PyPNGImage, border=4, box_size=12).save(sys.argv[2])' "$1" "$2" \
    && log "virtualscene-image: $(adb emu virtualscene-image table "$2" 2>&1 | tr '\n' ' ')"
}

run_steps() {
  local name=$1 field=$2 index=0 kind value
  while IFS=$'\t' read -r kind value; do
    [[ -z $kind ]] && continue
    index=$((index + 1))
    case $kind in
      tap) tap_label "$name-$index" "$value" < /dev/null || return 1 ;;
      type) type_secret "$SECRET" < /dev/null; sleep 1 ;;
      wait) sleep "$value" ;;
      *) log "$name: unknown step $kind"; return 1 ;;
    esac
  done < <(steps_of "$field")
}

open_scanner() {
  local name=$1 kind=$2
  adb shell am force-stop "$PKG"
  sleep 2
  adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 > /dev/null 2>&1
  sleep 6
  walk "$name-unlock" onboard 3
  run_steps "$name-nav" "scan.$kind"
}

settle() {
  local name=$1 tries=0 action prev="" prev_action="" hash
  while ((tries < 10)); do
    sleep 3
    capture "$name"
    hash=$(md5sum 2> /dev/null < "$OUT/$name.xml" | cut -c1-12)
    read -r action _ <<< "$(python3 "$HERE/screen.py" "$OUT/$name.xml" accept 2> /dev/null)"
    if [[ -n $hash && $hash == "$prev" && $action != wait && $prev_action != wait ]]; then
      return
    fi
    prev=$hash
    prev_action=$action
    tries=$((tries + 1))
  done
  log "$name still resolving after 30s"
}

walk() {
  local name=$1 mode=$2 limit=$3 prev="" step=0 action x y label hash seen_error
  while ((step < limit)); do
    step=$((step + 1))
    sleep 4
    capture "$name-$(printf %02d $step)"
    hash=$(md5sum < "$OUT/$name-$(printf %02d $step).xml" 2> /dev/null | cut -c1-12)
    read -r action x y label <<< "$(python3 "$HERE/screen.py" "$OUT/$name-$(printf %02d $step).xml" "$mode" 2> /dev/null)"
    if [[ $action == wait ]]; then
      log "$name $step: wait"
      continue
    fi
    if [[ -z $hash || $hash == "$prev" ]]; then
      log "$name stopped at $step (unchanged or unreadable screen)"
      return
    fi
    prev=$hash
    log "$name $step: $action ${label:-}"
    seen_error=$(python3 "$HERE/screen.py" "$OUT/$name-$(printf %02d $step).xml" error 2> /dev/null)
    [[ -n $seen_error ]] && echo "$seen_error" >> "$OUT/$name-errors.txt"
    case $action in
      tap) adb shell input tap "$x" "$y" ;;
      finish)
        adb shell input tap "$x" "$y"
        return
        ;;
      type) adb shell input tap "$x" "$y" && sleep 1 && type_secret "$SECRET"; sleep 1 ;;
      type-blind) type_secret "$SECRET"; sleep 1 ;;
      enter) adb shell input keyevent 66 ;;
      *) return ;;
    esac
  done
  log "$name hit its $limit step limit"
}

scenario() {
  local name=$1 kind=$2 flow=$3 expect=$4 cast=$5 svc=$6 needs=$7 mint_url=$8 state_url=$9
  local mint session url state state_done completed http handlers gate errors verdict reason pid exception
  mint="$OUT/$name-mint.json"
  curl -sS -m 30 "$mint_url" > "$mint"
  url=$(json "$mint" url)
  session=$(json "$mint" issuanceSessionId verificationSessionId)
  if [[ -z $url ]]; then
    log "$name mint failed: $(head -c 200 "$mint")"
    record "$cast" "$svc" "$name" unknown "mint failed: $(head -c 120 "$mint" | tr -d '\n')"
    return
  fi

  handlers=$(adb shell cmd package query-activities --brief -a android.intent.action.VIEW -d "'$url'" 2>&1 | grep '/' | tr -d ' ' | tr '\n' ' ')
  if [[ $DELIVERY == scan ]]; then
    show_qr "$url" "$OUT/$name-qr.png" || log "$name: qr injection failed"
    open_scanner "$name" "$kind" || log "$name: scanner not reached"
  else
    [[ $COLD == true ]] && adb shell am force-stop "$PKG" && sleep 2
    adb shell am start -W -a android.intent.action.VIEW -d "'$url'" > "$OUT/$name-start.txt" 2>&1
  fi
  settle "$name-consent"
  gate=$(python3 "$HERE/screen.py" "$OUT/$name-consent.xml" gate 2> /dev/null)
  rm -f "$OUT/$name-errors.txt"
  walk "$name" accept 12
  sleep 5
  pid=$(adb shell pidof "$PKG" | tr -d '\r' | awk '{print $1}')
  adb logcat -d > "$OUT/$name-logcat.txt" 2>&1
  adb logcat -c
  exception=$(grep -E " ${pid:-none} .* E .*(Exception|Error):" "$OUT/$name-logcat.txt" | grep -vE 'PushNotification|Firebase|TypefaceCompat' | head -1 | sed -E 's/^.* E [^:]+: //' | tr -d '"' | cut -c1-160)

  http=$(curl -sS -m 20 -o "$OUT/$name-state.json" -w '%{http_code}' "$state_url$session?rail=oid4vc")
  if [[ $http != 200 ]]; then
    sleep 3
    http=$(curl -sS -m 20 -o "$OUT/$name-state.json" -w '%{http_code}' "$state_url$session?rail=oid4vc")
  fi
  state=$(json "$OUT/$name-state.json" state)
  state_done=$(json "$OUT/$name-state.json" "done")
  completed=false
  [[ ${state_done,,} == true || $state == Completed || $state == "done" || $state == *Issued* ]] && completed=true
  errors=$(sort -u "$OUT/$name-errors.txt" 2> /dev/null | tr '\n' ';')
  if [[ -n $needs && $COMPLETED != *" $needs "* ]]; then
    verdict=unknown reason="needs the credential from $needs, which did not complete"
  elif [[ $http != 200 ]]; then
    verdict=unknown reason="state endpoint answered HTTP $http"
  elif [[ $state == OfferCreated || $state == RequestCreated || -z $state ]]; then
    verdict=unknown reason="wallet never fetched the payload"
  elif [[ $expect == accept && $completed == true ]]; then
    verdict=works reason="server completed"
  elif [[ $expect == accept && $gate == *enabled=false* ]]; then
    verdict=broken reason="accept blocked on a trusted service"
  elif [[ $expect == accept && -n $errors ]]; then
    verdict=broken reason="wallet showed: $errors ${exception:+app logged: $exception}"
  elif [[ $expect == accept ]]; then
    verdict=unknown reason="not completed, no error seen"
  elif [[ $completed == true || $gate == *enabled=true* ]]; then
    verdict=broken reason="untrusted payload could be accepted"
  elif [[ $gate == *enabled=false* ]]; then
    verdict=works reason="accept disabled and server not completed"
  else
    verdict=unknown reason="no accept control found"
  fi

  [[ $verdict == works ]] && COMPLETED+="$name "
  log "$name flow=$flow delivery=$DELIVERY expect=$expect server=$state gate=$gate handlers=[$handlers] verdict=$verdict ($reason)"
  record "$cast" "$svc" "$name" "$verdict" "$reason" "$state" "$gate" "$handlers" "$name-consent.png"
}

adb shell svc power stayon true
adb shell settings put system screen_off_timeout 1800000
adb shell locksettings set-pin "$DEVICE_PIN" > /dev/null
log "uptime $(adb shell cat /proc/uptime), device lock disabled=$(adb shell locksettings get-disabled)"

APK_DIR=$(mktemp -d)
APK="$APK_DIR/$WALLET.apk"
t0=$SECONDS
curl -fsSL -o "$APK" "$APK_URL" || abandon 1 "apk download failed: $APK_URL"
log "install: $(adb install -r -g "$APK" 2>&1 | tail -1) ($((SECONDS - t0))s)"
SIGNER_MISMATCH=""
if [[ -n $SIGNER ]]; then
  apksigner=$(command -v apksigner || ls -d "${ANDROID_HOME:-}"/build-tools/*/apksigner 2> /dev/null | tail -1)
  signer_seen=$("${apksigner:-apksigner}" verify --print-certs "$APK" 2> /dev/null | grep -i 'SHA-256 digest' | head -1 | tr -d ' ' | cut -d: -f2- | tr 'a-f' 'A-F')
  signer_want=$(echo "$SIGNER" | tr -d ' :' | tr 'a-f' 'A-F')
  if [[ ${signer_seen//:/} != "$signer_want" ]]; then
    SIGNER_MISMATCH="the downloaded apk is signed by ${signer_seen:-an unreadable certificate}, the profile pins $signer_want"
  fi
fi
log "apk abis: $(unzip -l "$APK" | grep -oE 'lib/[^/]+/' | sort -u | tr '\n' ' ')"

adb logcat -c
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 > /dev/null 2>&1
sleep 10
if [[ -z $(adb shell pidof "$PKG" | tr -d '\r' | awk '{print $1}') ]]; then
  log "no process after launch, reinstalling for arm64 translation"
  adb uninstall "$PKG" > /dev/null 2>&1
  log "install --abi arm64-v8a: $(adb install -r -g --abi arm64-v8a "$APK" 2>&1 | tail -1)"
  adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 > /dev/null 2>&1
  sleep 10
fi
rm -rf "$APK_DIR"
[[ -n $SIGNER_MISMATCH ]] && abandon 0 "$SIGNER_MISMATCH"
pid_now=$(adb shell pidof "$PKG" | tr -d '\r' | awk '{print $1}')
log "process after launch: ${pid_now:-none}"
run_steps onboard onboard || log "onboarding steps did not all land"
sleep 10
capture home

if [[ $DELIVERY == scan ]]; then
  pip install --quiet --break-system-packages qrcode pypng > /dev/null 2>&1
  show_qr "$BASE/camera-probe" "$OUT/camera-probe-qr.png"
  adb shell am start -a android.media.action.STILL_IMAGE_CAMERA > /dev/null 2>&1
  sleep 8
  capture camera-probe
  adb shell input keyevent 3
fi

t0=$SECONDS
while IFS=$'\x1f' read -r name kind flow expect cast service needs mint_url state_url; do
  scenario "$name" "$kind" "$flow" "$expect" "$cast" "$service" "$needs" "$mint_url" "$state_url" < /dev/null
done < <(runs)
log "scenarios took $((SECONDS - t0))s, whole run ${SECONDS}s"

adb logcat -d > "$OUT/logcat.txt" 2>&1
finish 0
