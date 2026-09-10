import { describe, expect, it } from "vitest";
import {
  asistenteDemoClaims,
  asistenteOid4vcClaims,
  DEFAULT_LEMA,
  DEFAULT_NOMBRE,
  DEFAULT_ORGANIZACION,
  eventosMintFromParams,
  patrocinadorDemoClaims,
  sanitizeTexto,
} from "./demo-eventos";
import { EVENTO_CLAIM, PATROCINADORES_CLAIM } from "./eventos";

describe("events demo claims", () => {
  it("reads the broker form from the mint query, sanitized", () => {
    const mint = eventosMintFromParams(
      new URLSearchParams({
        evento: "guatemala",
        nombre: "  Alejandro   Torres <script> ",
        organizacion: "B-TECH & Cía.",
        lema: "We make it easy!",
      }),
    );
    expect(mint).toEqual({
      evento: "guatemala",
      nombre: "Alejandro Torres script",
      organizacion: "B-TECH & Cía.",
      lema: "We make it easy",
    });
  });

  it("falls back to the first stop and the demo personas", () => {
    const mint = eventosMintFromParams(new URLSearchParams({ evento: "lima" }));
    expect(mint.evento).toBe("costa-rica");
    expect(mint.nombre).toBe(DEFAULT_NOMBRE);
    expect(mint.organizacion).toBe(DEFAULT_ORGANIZACION);
    expect(mint.lema).toBe(DEFAULT_LEMA);
    expect(sanitizeTexto("!!!", 10, "x")).toBe("x");
    expect(sanitizeTexto("a".repeat(50), 10, "x")).toHaveLength(10);
  });

  it("mints the event block of the picked stop into the boleto", () => {
    const claims = asistenteDemoClaims(
      eventosMintFromParams(
        new URLSearchParams({ evento: "panama", nombre: "Ana" }),
      ),
    );
    expect(Object.fromEntries(claims.map((c) => [c.name, c.value]))).toEqual({
      nombre: "Ana",
      tipo: "Asistente",
      evento: EVENTO_CLAIM,
      pais: "Panamá",
      fecha: "24 de septiembre de 2026",
      horario: "9:00 a 11:00 a.m.",
      patrocinadores: PATROCINADORES_CLAIM,
    });
    expect(asistenteOid4vcClaims({ evento: "panama", nombre: "Ana", organizacion: "", lema: "" }).nombre).toBe("Ana");
  });

  it("mints one sponsor credential per organization and event", () => {
    const claims = patrocinadorDemoClaims({
      evento: "costa-rica",
      nombre: DEFAULT_NOMBRE,
      organizacion: "HYLAND",
      lema: DEFAULT_LEMA,
    });
    expect(claims.map((c) => c.name)).toEqual([
      "organizacion", "lema", "tipo", "evento", "pais", "fecha", "horario",
    ]);
    expect(claims.find((c) => c.name === "tipo")?.value).toBe("Patrocinador");
    expect(claims.find((c) => c.name === "pais")?.value).toBe("Costa Rica");
  });
});
