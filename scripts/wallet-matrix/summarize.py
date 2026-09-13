#!/usr/bin/env python3
"""Turn a sweep's run files into one machine-readable summary."""
import json
import re
import sys
from pathlib import Path

HEADER = re.compile(r"^### (?P<label>\S+) / (?P<suite>\S+) / (?P<scenario>\S+)\s+\(expect (?P<expect>\w+)\)(?: pkg=(?P<pkg>\S+))?(?: version=(?P<version>\S+))?")
VERDICT = re.compile(r"^screen verdict: (?P<verdict>.+)$")
SERVER = re.compile(r"^server state:\s+(?P<server>.+)$")


def outcome(expect, verdict, server):
    if verdict.startswith("NOT-DELIVERED"):
        return "not-delivered"
    if verdict.startswith("ERROR"):
        return "broken"
    granted = "GRANTED" in verdict
    denied = "DENIED" in verdict
    completed = server in {"Completed", "done", "credential-issued", "ResponseVerified"}
    if expect == "accept":
        return "works" if granted and completed else "broken"
    return "works" if denied and not completed else "broken"


def parse(path):
    runs = []
    current = None
    for line in path.read_text(errors="replace").splitlines():
        head = HEADER.match(line)
        if head:
            current = head.groupdict()
            current["file"] = path.name
            runs.append(current)
            continue
        if current is None:
            continue
        found = VERDICT.match(line)
        if found:
            current["verdict"] = found.group("verdict").strip()
        found = SERVER.match(line)
        if found:
            current["server"] = found.group("server").strip()
    return runs


def main(directory):
    root = Path(directory)
    runs = []
    for path in sorted(root.glob("*.txt")):
        runs.extend(parse(path))
    for run in runs:
        run["outcome"] = outcome(run.get("expect", ""), run.get("verdict", "?"), run.get("server", "?"))

    for path in sorted(root.glob("*.incompatible")):
        label = path.stem
        runs.append({"label": label, "suite": "*", "scenario": "*", "outcome": "incompatible", "reason": path.read_text().strip()})
    for path in sorted(root.glob("*.skip")):
        runs.append({"label": path.stem, "suite": "*", "scenario": "*", "outcome": "skipped", "reason": path.read_text().strip()})
    for path in sorted(root.glob("*.missing")):
        runs.append({"label": path.stem, "suite": "*", "scenario": "*", "outcome": "not-installed"})

    totals = {}
    for run in runs:
        totals[run["outcome"]] = totals.get(run["outcome"], 0) + 1
    print(json.dumps({"directory": root.name, "totals": totals, "runs": runs}, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
