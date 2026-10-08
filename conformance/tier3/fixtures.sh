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

PLAN_FIXTURES="$HERE/fixtures/plan"

resolve() {
  CONFORMANCE_CASTS=$2 python3 "$HERE/suite.py" resolve "$PLAN_FIXTURES/networks.json" "$PLAN_FIXTURES/wallet.json" \
    "$PLAN_FIXTURES/scenarios.json" "$PLAN_FIXTURES/workflows" "$1" fixture-wallet
}

plan_expect() {
  local network=$1 casts=$2 query=$3 want=$4 got
  got=$(resolve "$network" "$casts" | python3 -c "import json, sys; p = json.load(sys.stdin); print($query)")
  if [[ $got != "$want" ]]; then
    echo "FAIL plan $network [$casts] $query: want '$want', got '$got'"
    fail=1
  fi
}

outline='" ".join([(p["build"] or {}).get("version") or "-"] + ["run:" + r["scenario"] for r in p["runs"]] + [c.get("scenario", c["clause"]) + ":" + c["outcome"] for c in p["cells"]])'

plan_expect net-a demo,eventos "$outline" \
  "a run:issue-accredited run:boleto-asistente run:present-accredited issue-untrusted:incompatible-by-design entrada-costa-rica:not-testable"
plan_expect net-a demo,eventos 'p["runs"][1]["mint"]' \
  "https://a.example/api/demo/taquilla?format=openid4vc-sdjwt&credential=eventos-asistente&evento=costa-rica&nombre=Con+Formance&signer=x5c"
plan_expect net-a demo,eventos 'p["runs"][2]["state"]' "https://a.example/api/demo/demo-verifier-accredited/proof/"
plan_expect net-b demo,eventos "$outline" "b run:issue-accredited run:issue-untrusted present-accredited:not-testable"
plan_expect net-b demo 'p["runs"][0]["mint"]' "https://b.example/api/demo/demo-issuer-accredited?format=openid4vc-sdjwt"
plan_expect net-c demo "$outline" "- CONF-NET-3:not-testable"
plan_expect net-d demo "$outline" "- issue-accredited:not-testable issue-untrusted:not-testable present-accredited:not-testable"
plan_expect net-d demo 'p["cells"][0]["cause"]' "no fork build of fixture-wallet targets net-d; the listed build targets net-a"

if ((fail)); then
  echo "fixtures failed"
  exit 1
fi
echo "fixtures ok"
