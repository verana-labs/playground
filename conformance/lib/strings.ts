const cp = String.fromCodePoint;

const MOJIBAKE = new RegExp(`${cp(0xc3)}[${cp(0x80)}-${cp(0xbf)}]|${cp(0xe2)}${cp(0x20ac)}`);
const REPLACEMENT = new RegExp(cp(0xfffd));

const PATTERNS: [string, RegExp][] = [
  ["map-serialisation", /\bmap\[/],
  ["replacement-character", REPLACEMENT],
  ["mojibake", MOJIBAKE],
  ["template-placeholder", /__[A-Z][A-Z0-9_]*__/],
  ["object-tostring", /\[object Object\]/],
  ["undefined-literal", /^(undefined|null|NaN)$/],
];

export function encodingDamage(value: string): string | null {
  for (const [name, re] of PATTERNS) if (re.test(value)) return name;
  return null;
}

export function collectStrings(value: unknown, path = ""): { path: string; value: string }[] {
  if (typeof value === "string") return [{ path, value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => collectStrings(v, path ? `${path}.${i}` : String(i)));
  if (value && typeof value === "object")
    return Object.entries(value).flatMap(([k, v]) => collectStrings(v, path ? `${path}.${k}` : k));
  return [];
}
