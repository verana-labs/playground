import { describe, expect, it } from "vitest";
import { collectStrings, encodingDamage } from "./strings";

const cp = String.fromCodePoint;

describe("encodingDamage", () => {
  it("flags go-style map serialisation, mojibake, replacement characters and unreplaced placeholders", () => {
    expect(encodingDamage("map[Revolución del Contenido Empresarial:Costa Rica]")).toBe("map-serialisation");
    expect(encodingDamage(`Taquilla Boleter${cp(0xc3)}${cp(0xad)}a`)).toBe("mojibake");
    expect(encodingDamage(`Panam${cp(0xfffd)}`)).toBe("replacement-character");
    expect(encodingDamage("__SERVICE_NAME__")).toBe("template-placeholder");
    expect(encodingDamage("[object Object]")).toBe("object-tostring");
    expect(encodingDamage("undefined")).toBe("undefined-literal");
  });

  it("accepts real text", () => {
    expect(encodingDamage("Creando un mundo confiable: Costa Rica")).toBeNull();
    expect(encodingDamage("Taquilla Boletería S.A.S. (demo)")).toBeNull();
    expect(encodingDamage("Panamá")).toBeNull();
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
