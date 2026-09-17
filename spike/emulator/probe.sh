#!/usr/bin/env bash
set -uo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
OUT="$HERE/out"
PROFILES="$HERE/../../conformance/profiles"
BASE=https://playground.testnet.verana.network
DEVICE_PIN=132006
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

walk() {
  local name=$1 secret=$2 mode=$3 prev="" last="" step sig action x y label
  for step in $(seq -w 1 14); do
    sleep 4
    capture "$name-$step"
    read -r sig action x y label <<< "$(python3 "$HERE/next_action.py" "$OUT/$name-$step.xml" "$mode" 2> /dev/null)"
    if [[ -n $sig && $sig == "$prev" && $last == typed ]]; then
      log "$name $step: enter"
      adb shell input keyevent 66
      last=entered
      continue
    fi
    if [[ -z $sig || $sig == "$prev" ]]; then
      log "$name stopped at $step (unchanged or unreadable screen)"
      return
    fi
    prev=$sig
    log "$name $step: $action ${label:-}"
    last=$action
    case $action in
      tap) adb shell input tap "$x" "$y" ;;
      type) adb shell input tap "$x" "$y" && type_secret "$secret" && last=typed ;;
      type-blind) type_secret "$secret" && last=typed ;;
      *) return ;;
    esac
  done
}

scenario() {
  local id=$1 name=$2 svc=$3 kind=$4 mode=$5 mint session url state
  mint="$OUT/$id-$name-mint.json"
  curl -sS -m 30 "$BASE/api/demo/$svc?format=openid4vc-sdjwt&$PARAMS" > "$mint"
  url=$(json "$mint" url)
  session=$(json "$mint" issuanceSessionId verificationSessionId)
  if [[ -z $url ]]; then
    log "$id $name mint failed: $(head -c 200 "$mint")"
    return
  fi
  [[ $COLD == true ]] && adb shell am force-stop "$PKG" && sleep 2
  adb shell am start -W -a android.intent.action.VIEW -d "'$url'" -n "$PKG/$ACT" > /dev/null 2>&1
  sleep 8
  capture "$id-$name-consent"
  if [[ $mode == accept ]]; then
    walk "$id-$name" "$SECRET" accept
  else
    sleep 10
    capture "$id-$name-held"
  fi
  sleep 5
  state=$(curl -sS -m 20 "$BASE/api/demo/$svc/$kind/$session?rail=oid4vc" > "$OUT/$id-$name-state.json" && json "$OUT/$id-$name-state.json" state)
  log "$id $name ($mode) server=$state"
}

probe_wallet() {
  local id=$1 build='.builds[] | select(.listed == true)' profile t0
  profile="$PROFILES/$id.yaml"
  PKG=$(yq "$build | .identity.package" "$profile")
  ACT=$(yq "$build | .device.activity" "$profile")
  SECRET=$(yq "$build | .device.secret" "$profile")
  COLD=$(yq "$build | .device.coldStart" "$profile")
  PARAMS=$(yq "$build | .demoParams // .openid4vc.demoParams" "$profile")
  [[ $PARAMS == null ]] && PARAMS=$(yq '.openid4vc.demoParams' "$profile")

  t0=$SECONDS
  curl -fsSL -o "$OUT/$id.apk" "$(yq "$build | .obtain" "$profile")" || { log "$id download failed"; return; }
  log "$id install: $(adb install -r -g "$OUT/$id.apk" 2>&1 | tail -1) ($((SECONDS - t0))s)"
  rm -f "$OUT/$id.apk"

  adb logcat -c
  adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 > /dev/null 2>&1
  sleep 10
  capture "$id-launch"
  walk "$id-onboard" "$SECRET" onboard
  capture "$id-home"

  t0=$SECONDS
  scenario "$id" issue-accredited demo-issuer-accredited credential accept
  scenario "$id" issue-unaccredited demo-issuer-unaccredited credential hold
  scenario "$id" present-accredited demo-verifier-accredited proof accept
  log "$id scenarios took $((SECONDS - t0))s"

  adb logcat -d > "$OUT/$id-logcat.txt" 2>&1
  adb shell am force-stop "$PKG"
}

adb shell svc power stayon true
adb shell settings put system screen_off_timeout 1800000
log "uptime $(adb shell cat /proc/uptime)"

for id in ${WALLETS:-eudi swiyu}; do
  if [[ $id == swiyu ]]; then
    adb shell locksettings set-pin "$DEVICE_PIN" > /dev/null
    log "device pin set, lock disabled: $(adb shell locksettings get-disabled 2>&1)"
  fi
  probe_wallet "$id"
done

log "done in ${SECONDS}s"
