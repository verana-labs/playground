import { readFileSync } from "node:fs";

const file = process.argv[2] ?? new URL("../results/latest.json", import.meta.url);
const results = JSON.parse(readFileSync(file, "utf8"));
const lines = [];
const cell = (v) => String(v ?? "").replaceAll("|", "\\|").slice(0, 200);
const table = (headers, rows) => {
  lines.push(`| ${headers.join(" | ")} |`);
  lines.push(`| ${headers.map(() => "---").join(" | ")} |`);
  for (const row of rows) lines.push(`| ${row.map(cell).join(" | ")} |`);
  lines.push("");
};

lines.push(`## Conformance ${results.id}`);
lines.push("");
lines.push(`Run ${results.startedAt} to ${results.finishedAt} on \`${results.gitBranch}\` @ \`${results.gitSha.slice(0, 8)}\`, networks: ${results.networks.join(", ")}`);
lines.push("");
table(["outcome", "cells"], Object.entries(results.totals));

const rowOf = (c) => [c.check, c.clause, `${c.cast ?? ""}/${c.service ?? ""}`, c.wallet ?? "", c.build ?? "", c.scenario ?? "", c.cause ?? ""];
const broken = results.cells.filter((c) => c.outcome === "broken");
const incompatible = results.cells.filter((c) => c.outcome === "incompatible-by-design");
const unknown = results.cells.filter((c) => c.outcome === "unknown");
if (broken.length) {
  lines.push("### Broken");
  table(["check", "clause", "service", "wallet", "build", "scenario", "cause"], broken.map(rowOf));
} else {
  lines.push("Nothing broken.");
  lines.push("");
}
if (incompatible.length) {
  lines.push("### Incompatible by design (not regressions)");
  table(["check", "clause", "service", "wallet", "build", "scenario", "cause"], incompatible.map(rowOf));
}
if (unknown.length) {
  lines.push(`### Unknown (${unknown.length})`);
  table(["check", "service", "cause"], unknown.map((c) => [c.check, `${c.cast ?? ""}/${c.service ?? ""}`, c.cause ?? ""]));
}
if (results.services.length) {
  lines.push("### Versions");
  table(["service", "pinned", "serving"], results.services.map((s) => [`${s.cast}/${s.id}`, s.pinnedTag, s.servingTag ?? `unknown (package ${s.packageVersion ?? "?"})`]));
}
process.stdout.write(`${lines.join("\n")}\n`);
