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
    demo_video: z.string().url().optional(),
    logo: z.string().optional(),
    badge_loop: z.enum(["live", "coming"]).optional(),
    notes: z.string().optional(),
  })
  .passthrough();

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
