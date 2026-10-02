#!/usr/bin/env bash
set -euo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
fail=0

expect() {
  local file=$1 mode=$2 want=$3 got
  got=$(python3 "$HERE/screen.py" "$HERE/fixtures/$file" "$mode" "${4:-}")
  if [[ $got != "$want" ]]; then
    echo "FAIL $file $mode: want '$want', got '$got'"
    fail=1
  fi
}

expect gated-consent.xml gate "add:enabled=false"
expect gated-consent.xml accept "stop"
expect open-consent.xml gate "add:enabled=true"
expect success.xml accept "finish 540 2232 close"
expect share-consent.xml gate "share:enabled=true"

if ((fail)); then
  echo "fixtures failed"
  exit 1
fi
echo "fixtures ok"
