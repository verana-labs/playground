import fs from "node:fs";
import { fileURLToPath } from "node:url";

const ROUTE_FILE = fileURLToPath(new URL("../../app/api/demo/[serviceId]/route.ts", import.meta.url));

function registryBody(source: string): string {
  const declaration = /const CREDENTIALS\b[^=]*=\s*\{/.exec(source);
  if (!declaration) throw new Error("app/api/demo/[serviceId]/route.ts declares no CREDENTIALS registry");
  const open = declaration.index + declaration[0].length - 1;
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}" && --depth === 0) return source.slice(open + 1, i);
  }
  throw new Error("the CREDENTIALS registry of app/api/demo/[serviceId]/route.ts never closes");
}

export function routeCredentials(source: string = fs.readFileSync(ROUTE_FILE, "utf8")): string[] {
  const body = registryBody(source);
  const ids: string[] = [];
  let depth = 0;
  for (const line of body.split("\n")) {
    const key = depth === 0 ? /^\s*"?([a-z0-9][a-z0-9-]*)"?\s*:\s*\{/.exec(line) : null;
    if (key?.[1]) ids.push(key[1]);
    for (const ch of line) {
      if (ch === "{") depth++;
      if (ch === "}") depth--;
    }
  }
  if (ids.length === 0) throw new Error("the CREDENTIALS registry of app/api/demo/[serviceId]/route.ts lists no credential");
  return ids;
}
