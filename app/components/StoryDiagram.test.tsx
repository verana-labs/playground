import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import StoryDiagram from "./StoryDiagram";
import type { NodeCredential, SceneGraph } from "./scene-graph";

// jsdom implements no SVG text metrics; the diagram only uses them to place
// the trusted check next to a label.
beforeAll(() => {
  (
    SVGElement.prototype as unknown as { getComputedTextLength: () => number }
  ).getComputedTextLength = () => 0;
});

const org: NodeCredential = {
  name: "ECS-Organization",
  tone: "emerald",
  issuedBy: "An accredited issuer",
  appears: "1",
};
const service: NodeCredential = {
  name: "ECS-Service",
  tone: "blue",
  issuedBy: "Self-issued",
  appears: "1",
};

const GRAPH: SceneGraph = {
  stages: ["0", "1"],
  title: "Test",
  defaultViewBox: "0 0 600 400",
  nodes: [
    { id: "whole", x: 100, y: 100, icon: "building", tone: "emerald", appears: "1", label: "Whole (demo)", did: "did:webvh:Qm:whole.example", verifiedAt: "1" },
    { id: "half", x: 250, y: 100, icon: "building", tone: "emerald", appears: "1", label: "Half (demo)", did: "did:webvh:Qm:half.example", verifiedAt: "1" },
    { id: "fake", x: 400, y: 100, icon: "ghost", tone: "red", appears: "1", dashed: true, label: "Fake (demo)" },
    // dashed on purpose: a context party is never an impostor, whatever else it carries
    { id: "source", x: 500, y: 100, icon: "landmark", tone: "gray", appears: "1", dashed: true, context: true, label: "Tax office" },
  ],
  edges: [],
  badges: [],
  credentials: { whole: [org, service], half: [org] },
  accreditations: {},
  nodeNotes: {
    fake: "Presents nothing at all.",
    source: "A data source, not a participant.",
  },
  stageView: {},
  stageChanges: {},
  verifiedNote: "Verified against the registry.",
};

const open = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name }));

const outline = (name: string) =>
  [...screen.getByRole("button", { name }).querySelectorAll("circle")].find(
    (c) => c.getAttribute("fill") === "#ffffff",
  );

describe("StoryDiagram trust card", () => {
  it("reads TRUSTED for a checked participant presenting both identity credentials", () => {
    render(<StoryDiagram graph={GRAPH} stage="1" />);
    open("Whole (demo) - view presented credentials");

    expect(screen.getByText("TRUSTED")).toBeDefined();
    expect(screen.queryByText("UNVERIFIABLE")).toBeNull();
    expect(screen.getByText("Verified against the registry.")).toBeDefined();
  });

  it("stays UNVERIFIABLE when an identity credential is missing", () => {
    render(<StoryDiagram graph={GRAPH} stage="1" />);
    open("Half (demo) - view presented credentials");

    expect(screen.getByText("UNVERIFIABLE")).toBeDefined();
    expect(screen.getByText("No ECS-Service credential presented.")).toBeDefined();
  });

  it("keeps the impostor styling for a dashed participant", () => {
    render(<StoryDiagram graph={GRAPH} stage="1" />);
    expect(outline("Fake (demo) - view presented credentials")?.getAttribute("stroke-dasharray")).toBe("4 3");

    open("Fake (demo) - view presented credentials");

    expect(screen.getByText("UNVERIFIABLE")).toBeDefined();
    expect(screen.getByText("Presents nothing at all.").className).toContain("text-red-600");
  });

  it("shows a context party by its note alone, never as an impostor", () => {
    render(<StoryDiagram graph={GRAPH} stage="1" />);
    expect(outline("Tax office - view details")?.getAttribute("stroke-dasharray")).toBeNull();

    open("Tax office - view details");

    const note = screen.getByText("A data source, not a participant.");
    expect(note.className).not.toContain("text-red");
    expect(screen.queryByText("UNVERIFIABLE")).toBeNull();
    expect(screen.queryByText("TRUSTED")).toBeNull();
    expect(screen.queryByText(/credential presented/)).toBeNull();
  });
});
