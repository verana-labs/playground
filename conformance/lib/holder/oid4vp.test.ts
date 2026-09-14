import { describe, expect, it } from "vitest";
import { buildSubmission, vpTokenFor } from "./oid4vp";

describe("buildSubmission", () => {
  it("maps the input descriptor id into a vc+sd-jwt descriptor map", () => {
    const submission = buildSubmission("descriptor-1");
    expect(submission.descriptor_map).toEqual([{ id: "descriptor-1", format: "vc+sd-jwt", path: "$" }]);
    expect(typeof submission.id).toBe("string");
    expect(submission.id.length).toBeGreaterThan(0);
    expect(typeof submission.definition_id).toBe("string");
  });

  it("uses the given definition id when provided", () => {
    const submission = buildSubmission("descriptor-1", "definition-1");
    expect(submission.definition_id).toBe("definition-1");
  });
});

describe("vpTokenFor", () => {
  it("keys the presentation by credential query id for dcql", () => {
    expect(vpTokenFor("dcql", { credentialQueryId: "c1" }, "presentation")).toEqual({ c1: "presentation" });
  });

  it("returns the bare presentation for presentation_exchange", () => {
    expect(vpTokenFor("presentation_exchange", { credentialQueryId: "c1" }, "presentation")).toBe("presentation");
  });
});
