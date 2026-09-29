import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import StoryDiagram from "../../components/StoryDiagram";
import { nodeLabelAt, stageIndex, visibleAt } from "../../components/scene-graph";
import { BHI_SCENES, STAGES } from "./scenes";

// jsdom implements no SVG text metrics; the diagram only uses them to place
// the trusted check next to a label.
beforeAll(() => {
  (
    SVGElement.prototype as unknown as { getComputedTextLength: () => number }
  ).getComputedTextLength = () => 0;
});

// The stages the journey renders: every one after the baseline world.
const PAGE_STAGES = STAGES.slice(1);

/** The participants drawn with the green check at a stage. */
function checkedAt(stage: string) {
  const view = BHI_SCENES.stageView[stage];
  return BHI_SCENES.nodes.filter(
    (n) =>
      n.verifiedAt !== undefined &&
      stageIndex(BHI_SCENES, n.verifiedAt) <= stageIndex(BHI_SCENES, stage) &&
      visibleAt(BHI_SCENES, n, stage) &&
      (!view?.only || view.only.includes(n.id)),
  );
}

describe("BHI story diagram", () => {
  it.each(PAGE_STAGES)(
    "at step %s, every participant carrying the green check reads TRUSTED",
    (stage) => {
      render(<StoryDiagram graph={BHI_SCENES} stage={stage} />);
      const checked = checkedAt(stage);
      expect(checked.length).toBeGreaterThan(0);

      for (const node of checked) {
        const { label } = nodeLabelAt(BHI_SCENES, node, stage);
        fireEvent.click(
          screen.getByRole("button", {
            name: `${label} - view presented credentials`,
          }),
        );
        expect(screen.queryByText("UNVERIFIABLE"), `${node.id} at ${stage}`).toBeNull();
        expect(screen.getByText("TRUSTED"), `${node.id} at ${stage}`).toBeDefined();
        fireEvent.click(screen.getByRole("button", { name: "Close details" }));
      }
    },
  );

  it("names Orchestrating Identity as a trusted service from its first appearance", () => {
    render(<StoryDiagram graph={BHI_SCENES} stage="3.1" />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Orchestrating Identity - view presented credentials",
      }),
    );

    expect(screen.getByText("TRUSTED")).toBeDefined();
    expect(screen.queryByText("No ECS-Service credential presented.")).toBeNull();
  });

  it("shows HMRC for context: a plain outline and its note, no verdict", () => {
    render(<StoryDiagram graph={BHI_SCENES} stage="3.4" />);
    const hmrc = screen.getByRole("button", { name: "HMRC - view details" });
    const outline = [...hmrc.querySelectorAll("circle")].find(
      (c) => c.getAttribute("fill") === "#ffffff",
    );
    expect(outline?.getAttribute("stroke-dasharray")).toBeNull();

    fireEvent.click(hmrc);

    const note = screen.getByText(/^The Data \(Use and Access\) Act 2025/);
    expect(note.className).not.toContain("text-red");
    expect(screen.queryByText("UNVERIFIABLE")).toBeNull();
    expect(screen.queryByText(/credential presented/)).toBeNull();
  });

  it("draws only the two antagonists as impostors", () => {
    expect(
      BHI_SCENES.nodes.filter((n) => n.dashed && !n.context).map((n) => n.id),
    ).toEqual(["halcyon", "northgate"]);
  });
});
