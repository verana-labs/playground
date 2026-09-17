#!/usr/bin/env bash
set -uo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
OUT="$HERE/out"
PROFILES="$HERE/../../conformance/profiles"
BASE=https://playground.testnet.verana.network
DEVICE_PIN=132006
WALLET=${WALLET:?set WALLET to a profile id}
DELIVERY=${DELIVERY:-link}
declare -A SCAN_PATH=(
  [eudi-issue]="documents|add|scan qr"
  [eudi-present]="home|authenticate|scan qr"
  [swiyu-issue]="scan"
  [swiyu-present]="scan"
)
mkdir -p "$OUT"

log() { echo "[$(date +%T)] $*" | tee -a "$OUT/probe.log"; }
json() { python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); print(next((d[k] for k in sys.argv[2:] if d.get(k)), ""))' "$@" 2> /dev/null; }

capture() {
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
  read -r x y <<< "$(python3 "$HERE/next_action.py" "$OUT/$name.xml" find "$wanted" 2> /dev/null)"
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

open_scanner() {
  local name=$1 kind=$2 step=0 wanted
  adb shell am force-stop "$PKG"
  sleep 2
  adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 > /dev/null 2>&1
  sleep 6
  walk "$name-unlock" onboard 3
  IFS='|' read -ra steps <<< "${SCAN_PATH[$WALLET-$kind]:-}"
  if ((${#steps[@]} == 0)); then
    log "$name: no scanner path for $WALLET $kind"
    return 1
  fi
  for wanted in "${steps[@]}"; do
    step=$((step + 1))
    tap_label "$name-nav-$step" "$wanted" || return 1
  done
}

settle() {
  local name=$1 tries=0 action
  while ((tries < 10)); do
    sleep 3
    capture "$name"
    read -r action _ <<< "$(python3 "$HERE/next_action.py" "$OUT/$name.xml" accept 2> /dev/null)"
    [[ $action != wait ]] && return
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
    read -r action x y label <<< "$(python3 "$HERE/next_action.py" "$OUT/$name-$(printf %02d $step).xml" "$mode" 2> /dev/null)"
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
    seen_error=$(python3 "$HERE/next_action.py" "$OUT/$name-$(printf %02d $step).xml" error 2> /dev/null)
    [[ -n $seen_error ]] && echo "$seen_error" >> "$OUT/$name-errors.txt"
    case $action in
      tap) adb shell input tap "$x" "$y" ;;
      finish)
        adb shell input tap "$x" "$y"
        return
        ;;
      type) adb shell input tap "$x" "$y" && type_secret "$SECRET" ;;
      type-blind) type_secret "$SECRET" ;;
      enter) adb shell input keyevent 66 ;;
      *) return ;;
    esac
  done
  log "$name hit its $limit step limit"
}

scenario() {
  local name=$1 svc=$2 kind=$3 expect=$4 mint session url state handlers gate errors verdict reason pid exception
  mint="$OUT/$name-mint.json"
  curl -sS -m 30 "$BASE/api/demo/$svc?format=openid4vc-sdjwt&$PARAMS" > "$mint"
  url=$(json "$mint" url)
  session=$(json "$mint" issuanceSessionId verificationSessionId)
  if [[ -z $url ]]; then
    log "$name mint failed: $(head -c 200 "$mint")"
    return
  fi

  handlers=$(adb shell cmd package query-activities --brief -a android.intent.action.VIEW -d "'$url'" 2>&1 | grep '/' | tr -d ' ' | tr '\n' ' ')
  if [[ $DELIVERY == scan ]]; then
    show_qr "$url" "$OUT/$name-qr.png" || log "$name: qr injection failed"
    local flow=present
    [[ $kind == credential ]] && flow=issue
    open_scanner "$name" "$flow" || log "$name: scanner not reached"
  else
    [[ $COLD == true ]] && adb shell am force-stop "$PKG" && sleep 2
    adb shell am start -W -a android.intent.action.VIEW -d "'$url'" > "$OUT/$name-start.txt" 2>&1
  fi
  settle "$name-consent"
  gate=$(python3 "$HERE/next_action.py" "$OUT/$name-consent.xml" gate 2> /dev/null)
  rm -f "$OUT/$name-errors.txt"
  walk "$name" accept 12
  sleep 5
  pid=$(adb shell pidof "$PKG" | tr -d '\r')
  adb logcat -d > "$OUT/$name-logcat.txt" 2>&1
  adb logcat -c
  exception=$(grep -E " ${pid:-none} .* E .*(Exception|Error):" "$OUT/$name-logcat.txt" | grep -vE 'PushNotification|Firebase|TypefaceCompat' | head -1 | sed -E 's/^.* E [^:]+: //' | tr -d '"' | cut -c1-160)

  curl -sS -m 20 "$BASE/api/demo/$svc/$kind/$session?rail=oid4vc" > "$OUT/$name-state.json"
  state=$(json "$OUT/$name-state.json" state)
  errors=$(sort -u "$OUT/$name-errors.txt" 2> /dev/null | tr '\n' ';')
  if [[ $state == OfferCreated || $state == RequestCreated || -z $state ]]; then
    verdict=unknown reason="wallet never fetched the payload"
  elif [[ $expect == accept && ($state == Completed || $state == done) ]]; then
    verdict=works reason="server completed"
  elif [[ $expect == accept && $gate == *enabled=false* ]]; then
    verdict=broken reason="accept blocked on a trusted service"
  elif [[ $expect == accept && -n $errors ]]; then
    verdict=broken reason="wallet showed: $errors ${exception:+app logged: $exception}"
  elif [[ $expect == accept ]]; then
    verdict=unknown reason="not completed, no error seen"
  elif [[ $state == Completed || $state == done || $gate == *enabled=true* ]]; then
    verdict=broken reason="untrusted payload could be accepted"
  elif [[ $gate == *enabled=false* ]]; then
    verdict=works reason="accept disabled and server not completed"
  else
    verdict=unknown reason="no accept control found"
  fi

  log "$name delivery=$DELIVERY expect=$expect server=$state gate=$gate handlers=[$handlers] verdict=$verdict ($reason)"
  printf '{"wallet":"%s","delivery":"%s","scenario":"%s","expect":"%s","server":"%s","gate":"%s","handlers":"%s","verdict":"%s","reason":"%s"}\n' \
    "$WALLET" "$DELIVERY" "$name" "$expect" "$state" "$gate" "$handlers" "$verdict" "$reason" >> "$OUT/cells.jsonl"
}

build='.builds[] | select(.listed == true)'
profile="$PROFILES/$WALLET.yaml"
PKG=$(yq "$build | .identity.package" "$profile")
SECRET=$(yq "$build | .device.secret" "$profile")
COLD=$(yq "$build | .device.coldStart" "$profile")
PARAMS=$(yq "$build | .demoParams // \"\"" "$profile")
[[ -z $PARAMS ]] && PARAMS=$(yq '.openid4vc.demoParams // ""' "$profile")

adb shell svc power stayon true
adb shell settings put system screen_off_timeout 1800000
adb shell locksettings set-pin "$DEVICE_PIN" > /dev/null
log "uptime $(adb shell cat /proc/uptime), device lock disabled=$(adb shell locksettings get-disabled)"

t0=$SECONDS
curl -fsSL -o "$OUT/$WALLET.apk" "$(yq "$build | .obtain" "$profile")" || { log "download failed"; exit 1; }
log "install: $(adb install -r -g "$OUT/$WALLET.apk" 2>&1 | tail -1) ($((SECONDS - t0))s)"
rm -f "$OUT/$WALLET.apk"

adb logcat -c
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 > /dev/null 2>&1
sleep 10
walk onboard onboard 24
sleep 10
capture home

if [[ $DELIVERY == scan ]]; then
  pip install --quiet --break-system-packages qrcode pypng > /dev/null 2>&1
  show_qr "https://playground.testnet.verana.network/camera-probe" "$OUT/camera-probe-qr.png"
  adb shell am start -a android.media.action.STILL_IMAGE_CAMERA > /dev/null 2>&1
  sleep 8
  capture camera-probe
  adb shell input keyevent 3
fi

t0=$SECONDS
scenario issue-accredited demo-issuer-accredited credential accept
scenario issue-unaccredited demo-issuer-unaccredited credential refuse
scenario present-accredited demo-verifier-accredited proof accept
log "scenarios took $((SECONDS - t0))s, whole run ${SECONDS}s"

adb logcat -d > "$OUT/logcat.txt" 2>&1
