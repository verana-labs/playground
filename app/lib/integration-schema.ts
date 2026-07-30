import { z } from "zod";

export const IntegrationSchema = z
  .object({
    name: z.string().min(1),
    organization: z.string().min(1).optional(),
    kind: z.enum(["user-wallet", "cloud-wallet"]),
    repo: z.string().url().optional(),
    license: z.string().min(1).optional(),
    track: z.string().optional(),
    scenarios: z.array(z.string()).optional(),
    download: z.string().url().optional(),
    playstore: z.string().url().optional(),
    appstore: z.string().url().optional(),
    // A URL, or a path relative to the descriptor (./demo.mp4) like `logo`.
    demo_video: z.string().min(1).optional(),
    demo_video_note: z.string().optional(),
    logo: z.string().optional(),
    screenshots: z
      .array(z.object({ src: z.string().min(1), caption: z.string().optional() }))
      .optional(),
    // Whether this wallet completes the six DemoCredential scenarios of
    // spec §4 (over its track's rail). `badge_loop` is the legacy name.
    demo_loop: z.enum(["live", "coming"]).optional(),
    badge_loop: z.enum(["live", "coming"]).optional(),
    // Per-scenario captures of this wallet's expected behavior (spec §4);
    // keys match the six scenario cards. Values are URLs or ./-relative paths.
    captures: z
      .record(
        z.enum([
          "issue-accredited",
          "issue-unaccredited",
          "issue-untrusted",
          "present-accredited",
          "present-unaccredited",
          "present-untrusted",
        ]),
        z.object({ src: z.string().min(1), caption: z.string().optional() }),
      )
      .optional(),
    demo_service: z.string().optional(),
    notes: z.string().optional(),
    contact: z.string().optional(),
    fides: z.string().url().optional(),
  })
  .passthrough()
  .superRefine((d, ctx) => {
    if (d.kind === "user-wallet" && !d.download) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["download"],
        message: "user-wallet requires a download link",
      });
    }
  });

export type IntegrationData = z.infer<typeof IntegrationSchema>;

export function parseIntegration(raw: unknown, slug: string): IntegrationData {
  const result = IntegrationSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
      .join("; ");
    throw new Error(`integrations/${slug}/integration.yaml invalid — ${issues}`);
  }
  return result.data;
}
