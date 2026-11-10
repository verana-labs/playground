import { describe, expect, it } from "vitest";
import { collectStrings, encodingDamage } from "./strings";

const cp = String.fromCodePoint;

describe("encodingDamage", () => {
  it("flags go-style map serialisation, mojibake, replacement characters and unreplaced placeholders", () => {
    expect(encodingDamage("map[Registro Civil Nacional:Verandia]")).toBe("map-serialisation");
    expect(encodingDamage(`Revisi${cp(0xc3)}${cp(0xb3)}n t${cp(0xc3)}${cp(0xa9)}cnica`)).toBe("mojibake");
    expect(encodingDamage(`Z${cp(0xfffd)}rich`)).toBe("replacement-character");
    expect(encodingDamage("__SERVICE_NAME__")).toBe("template-placeholder");
    expect(encodingDamage("[object Object]")).toBe("object-tostring");
    expect(encodingDamage("undefined")).toBe("undefined-literal");
  });

  it("accepts real text", () => {
    expect(encodingDamage("Registro Civil Nacional: Verandia")).toBeNull();
    expect(encodingDamage("Revisión técnica S.A.S. (demo)")).toBeNull();
    expect(encodingDamage("Zürich")).toBeNull();
  });
});

describe("collectStrings", () => {
  it("walks nested json", () => {
    expect(collectStrings({ a: "x", b: [{ c: "y" }], d: 1 })).toEqual([
      { path: "a", value: "x" },
      { path: "b.0.c", value: "y" },
    ]);
  });
});
