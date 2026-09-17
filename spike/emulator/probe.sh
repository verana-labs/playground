#!/usr/bin/env bash
set -uo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
OUT="$HERE/out"
PROFILES="$HERE/../../conformance/profiles"
mkdir -p "$OUT"

log() { echo "[$(date +%T)] $*" | tee -a "$OUT/probe.log"; }

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
  adb shell input keyevent 66
}

walk() {
  local id=$1 secret=$2 prev="" step action x y label hash
  for step in $(seq -w 1 12); do
    sleep 4
    capture "$id-walk-$step"
    hash=$(md5sum < "$OUT/$id-walk-$step.xml" 2> /dev/null | cut -c1-12)
    if [[ -z $hash || $hash == "$prev" ]]; then
      log "$id walk stopped at $step (unchanged or unreadable screen)"
      return
    fi
    prev=$hash
    read -r action x y label <<< "$(python3 "$HERE/next_action.py" "$OUT/$id-walk-$step.xml")"
    log "$id walk $step: $action ${label:-}"
    case $action in
      tap) adb shell input tap "$x" "$y" ;;
      type) adb shell input tap "$x" "$y" && type_secret "$secret" ;;
      type-blind) type_secret "$secret" ;;
      *) return ;;
    esac
  done
}

probe_wallet() {
  local id=$1 build='.builds[] | select(.listed == true)'
  local profile="$PROFILES/$id.yaml" url pkg act secret t0
  url=$(yq "$build | .obtain" "$profile")
  pkg=$(yq "$build | .identity.package" "$profile")
  act=$(yq "$build | .device.activity" "$profile")
  secret=$(yq "$build | .device.secret" "$profile")

  t0=$SECONDS
  if ! curl -fsSL -o "$OUT/$id.apk" "$url"; then
    log "$id download failed: $url"
    return
  fi
  log "$id abis in apk: $(unzip -l "$OUT/$id.apk" | grep -oE 'lib/[^/]+/' | sort -u | tr '\n' ' ')"
  log "$id install: $(adb install -r -g "$OUT/$id.apk" 2>&1 | tail -1) ($((SECONDS - t0))s)"
  rm -f "$OUT/$id.apk"
  adb shell pm path "$pkg" > /dev/null 2>&1 || return

  adb logcat -c
  t0=$SECONDS
  adb shell am start -W -n "$pkg/$act" > "$OUT/$id-start.txt" 2>&1
  grep -q Error "$OUT/$id-start.txt" && adb shell monkey -p "$pkg" -c android.intent.category.LAUNCHER 1 > /dev/null 2>&1
  sleep 10
  capture "$id-launch"
  log "$id launched, pid=$(adb shell pidof "$pkg") ($((SECONDS - t0))s)"

  walk "$id" "$secret"
  capture "$id-final"
  adb logcat -d -b crash > "$OUT/$id-crash.txt" 2>&1
  adb logcat -d > "$OUT/$id-logcat.txt" 2>&1
  log "$id still running: pid=$(adb shell pidof "$pkg")"
  adb shell am force-stop "$pkg"
}

log "uptime $(adb shell cat /proc/uptime)"
log "abilist $(adb shell getprop ro.product.cpu.abilist)"
log "android $(adb shell getprop ro.build.version.release) sdk $(adb shell getprop ro.build.version.sdk)"
log "native bridge $(adb shell getprop ro.dalvik.vm.native.bridge)"
log "emulator $("$ANDROID_HOME/emulator/emulator" -version 2> /dev/null | head -1)"
log "screen $(adb shell wm size)"
adb emu help > "$OUT/emu-help.txt" 2>&1
log "finger touch: $(adb emu finger touch 1 2>&1 | tr '\n' ' ')"
log "virtualscene-image: $(adb emu virtualscene-image 2>&1 | tr '\n' ' ')"

for id in eudi swiyu inji; do
  probe_wallet "$id"
done

log "done in ${SECONDS}s"
