import json
import os
import re
import subprocess
import sys
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

RAIL = "openid4vc-sdjwt"
FLOWS = {"issue": "credential", "present": "proof"}
OUTCOMES = ["works", "broken", "incompatible-by-design", "unknown", "not-testable"]
RUN_FIELDS = ["scenario", "kind", "flow", "expect", "cast", "service", "needs", "mint", "state"]
SEP = "\x1f"


def load(path):
    with open(path) as f:
        return json.load(f)


def service_casts(workflows):
    casts = {}
    for env in sorted(Path(workflows).glob("*/orgs/*/config.env")):
        match = re.search(r'^RELEASE_NAME="?([^"\n]+?)"?\s*$', env.read_text(), re.M)
        if match:
            casts.setdefault(match.group(1), env.parent.parent.parent.name)
    return casts


def targets(build, network):
    return not build.get("networks") or network in build["networks"]


def network_build(profile, network):
    listed = next(b for b in profile["builds"] if b.get("listed"))
    if targets(listed, network):
        return listed, listed
    other = next((b for b in profile["builds"] if b["kind"] == listed["kind"] and network in (b.get("networks") or [])), None)
    return listed, other


def apk_or_first(obtain):
    urls = [obtain] if isinstance(obtain, str) else obtain
    return next((u for u in urls if urllib.parse.urlparse(u).path.endswith(".apk")), urls[0])


def incompatibility(build, scenario, service):
    for entry in build.get("incompatibilities") or []:
        if (entry["scenarios"] == "all" or scenario in entry["scenarios"]) and (not entry.get("services") or service in entry["services"]):
            return entry
    return None


def demo_params(profile, build):
    own = build.get("demoParams")
    return own if own is not None else (profile.get("openid4vc") or {}).get("demoParams", "")


def mint_url(base, service, scenario, params):
    query = {"format": RAIL}
    if scenario.get("credential"):
        query["credential"] = scenario["credential"]
    if scenario["kind"] == "issue":
        query.update(scenario.get("params") or {})
    parts = [urllib.parse.urlencode(query)] + [p for p in params.split("&") if p]
    return f"{base}/api/demo/{service}?{'&'.join(parts)}"


def scoped_casts(network):
    wanted = [c.strip() for c in os.environ.get("CONFORMANCE_CASTS", "demo").split(",") if c.strip()]
    deployed = network.get("casts")
    return [c for c in wanted if not deployed or c in deployed]


def resolve(networks_json, profile_json, scenarios_json, workflows, network_id, wallet):
    networks = load(networks_json)["networks"]
    network = next((n for n in networks if n["id"] == network_id), None)
    if network is None:
        sys.exit(f"unknown network {network_id}; known: {', '.join(n['id'] for n in networks)}")
    profile = load(profile_json)
    casts = scoped_casts(network)
    plan = {"network": network_id, "playground": network.get("playground"), "casts": casts, "wallet": wallet,
            "build": None, "skip": None, "cells": [], "runs": []}

    if not network["testable"]:
        plan["cells"].append({"tier": "t3", "check": "consent-flow", "clause": "CONF-NET-3", "network": network_id,
                              "wallet": wallet, "outcome": "not-testable", "cause": network.get("reason")})
        return plan
    if RAIL not in profile["rails"]:
        plan["skip"] = f"tier 3 drives the {RAIL} rail only"
        return plan

    listed, build = network_build(profile, network_id)
    if build is not None and not (build.get("device") or {}).get("onboard"):
        plan["skip"] = f"the {build['kind']} build has no device.onboard steps"
        return plan

    device = (build or {}).get("device") or {}
    identity = (build or {}).get("identity") or {}
    if build is not None:
        plan["build"] = {
            "kind": build["kind"], "label": build["label"], "obtain": apk_or_first(build["obtain"]),
            "version": identity.get("version"), "package": identity.get("package"),
            "signerSha256": build.get("signerSha256"), "networks": build.get("networks"),
            "delivery": device.get("delivery", "scan"), "secret": device.get("secret", ""),
            "coldStart": device.get("coldStart", False), "onboard": device.get("onboard", []),
            "scan": device.get("scan") or {},
        }

    casts_of = service_casts(workflows)
    params = demo_params(profile, build) if build is not None else ""
    base = network["playground"]
    ordered = [s for s in scenarios_json if s["kind"] == "issue"] + [s for s in scenarios_json if s["kind"] == "present"]
    planned = set()
    for scenario in ordered:
        service = scenario["service"] if isinstance(scenario["service"], str) else scenario["service"][RAIL]
        cast = casts_of.get(service)
        if cast not in casts:
            continue
        cell = {"tier": "t3", "check": "consent-flow", "clause": "CONF-T3-1", "network": network_id, "cast": cast,
                "service": service, "wallet": wallet, "build": (build or listed)["kind"], "scenario": scenario["id"]}
        flow = FLOWS[scenario["kind"]]
        if build is None:
            reason = f"no {listed['kind']} build of {wallet} targets {network_id}"
            if listed.get("networks"):
                reason += f"; the listed build targets {', '.join(listed['networks'])}"
            plan["cells"].append({**cell, "outcome": "not-testable", "cause": reason})
            continue
        hit = incompatibility(build, scenario["id"], service)
        if hit:
            plan["cells"].append({**cell, "outcome": "incompatible-by-design", "cause": hit["cause"],
                                  **({"reference": hit["reference"]} if hit.get("reference") else {})})
            continue
        cause = None
        if not urllib.parse.urlparse(plan["build"]["obtain"]).path.endswith(".apk"):
            cause = "the build has no direct apk download"
        elif scenario.get("login"):
            cause = "tier 3 does not drive the eventos login"
        elif plan["build"]["delivery"] == "scan" and not plan["build"]["scan"].get(scenario["kind"]):
            cause = f"the profile has no device.scan.{scenario['kind']} steps"
        elif scenario.get("needs") and scenario["needs"] not in planned:
            cause = f"needs {scenario['needs']}, which tier 3 does not run here"
        if cause:
            plan["cells"].append({**cell, "outcome": "not-testable", "cause": cause})
            continue
        planned.add(scenario["id"])
        plan["runs"].append({
            "scenario": scenario["id"], "kind": scenario["kind"], "flow": flow, "expect": scenario["expect"],
            "cast": cast, "service": service, "needs": scenario.get("needs", ""),
            "mint": mint_url(base, service, scenario, params),
            "state": f"{base}/api/demo/{service}/{flow}/",
        })
    return plan


def get(plan, dotted):
    value = plan
    for key in dotted.split("."):
        value = value.get(key) if isinstance(value, dict) else None
    if value is None:
        return ""
    if isinstance(value, bool):
        return str(value).lower()
    return value if isinstance(value, str) else json.dumps(value)


def steps(plan, dotted):
    for step in json.loads(get(plan, dotted) or "[]"):
        kind, value = next(iter(step.items()))
        print(f"{kind}\t{value}")


def runs(plan):
    for run in plan["runs"]:
        print(SEP.join(str(run[f]) for f in RUN_FIELDS))


def show(plan):
    out = [f"tier 3 plan for {plan['wallet']} on {plan['network']}"]
    out.append(f"  playground {plan['playground']}, casts {', '.join(plan['casts']) or 'none'}")
    build = plan["build"]
    if build:
        out.append(f"  build      {build['kind']} \"{build['label']}\" ({build['version'] or 'no version'}), networks {', '.join(build['networks'] or ['every network'])}")
        out.append(f"  apk        {build['obtain']}")
        out.append(f"  package    {build['package']}, signer {build['signerSha256'] or 'not pinned'}")
        out.append(f"  device     delivery {build['delivery']}, cold start {str(build['coldStart']).lower()}, {len(build['onboard'])} onboarding steps")
    if plan["skip"]:
        out.append(f"  skipped    {plan['skip']}, no cells")
    for run in plan["runs"]:
        out.append(f"  run        {run['scenario']} on {run['cast']}/{run['service']}, expect {run['expect']}{', needs ' + run['needs'] if run['needs'] else ''}")
        out.append(f"               mint  GET {run['mint']}")
        out.append(f"               state GET {run['state']}<session>?rail=oid4vc")
    for cell in plan["cells"]:
        out.append(f"  record     {cell.get('scenario', '-')} {cell['outcome']}: {cell.get('cause', '')}")
    out.append(f"  emulator   {'needed' if plan['runs'] else 'not needed'}")
    print("\n".join(out))


def cell(path):
    env = os.environ
    record = {
        "tier": "t3", "check": "consent-flow", "clause": "CONF-T3-1", "network": env["CELL_NETWORK"],
        "cast": env["CELL_CAST"], "service": env["CELL_SERVICE"], "wallet": env["CELL_WALLET"],
        "build": env["CELL_BUILD"], "scenario": env["CELL_SCENARIO"], "outcome": env["CELL_OUTCOME"],
        "cause": env["CELL_CAUSE"],
        "evidence": {key: env.get(f"CELL_{name}", "") for key, name in [
            ("version", "VERSION"), ("delivery", "DELIVERY"), ("serverState", "STATE"), ("gate", "GATE"),
            ("handlers", "HANDLERS"), ("screenshot", "SCREENSHOT")]},
    }
    with open(path, "a") as f:
        f.write(json.dumps(record) + "\n")


def cell_key(c):
    return "|".join(c.get(f) or "" for f in ["tier", "check", "network", "cast", "service", "wallet", "build", "scenario"])


def git(*args):
    try:
        return subprocess.run(["git", *args], capture_output=True, text=True, check=True).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return ""


def results(cells_path, results_dir, run_id, network, wallet, started):
    lines = Path(cells_path).read_text().splitlines() if Path(cells_path).exists() else []
    cells = sorted((json.loads(line) for line in lines if line.strip()), key=cell_key)
    run_dir = Path(results_dir) / run_id
    run_dir.mkdir(parents=True, exist_ok=True)
    (run_dir / f"cells-t3-{network}-{wallet}.jsonl").write_text("".join(json.dumps(c) + "\n" for c in cells))
    payload = {
        "id": run_id, "startedAt": started, "gitSha": git("rev-parse", "HEAD"),
        "gitBranch": git("rev-parse", "--abbrev-ref", "HEAD"), "networks": [network],
        "finishedAt": datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z"),
        "totals": {o: sum(1 for c in cells if c["outcome"] == o) for o in OUTCOMES},
        "services": [], "cells": cells,
    }
    text = json.dumps(payload, indent=2) + "\n"
    (run_dir / "results.json").write_text(text)
    (Path(results_dir) / "latest.json").write_text(text)


command, args = sys.argv[1], sys.argv[2:]
if command == "resolve":
    print(json.dumps(resolve(args[0], args[1], load(args[2])["scenarios"], args[3], args[4], args[5]), indent=2))
elif command == "show":
    show(load(args[0]))
elif command == "get":
    print(get(load(args[0]), args[1]))
elif command == "steps":
    steps(load(args[0]), args[1])
elif command == "runs":
    runs(load(args[0]))
elif command == "cells":
    for c in load(args[0])["cells"]:
        print(json.dumps(c))
elif command == "cell":
    cell(args[0])
elif command == "results":
    results(*args)
else:
    sys.exit(f"unknown command {command}")
