import { fileURLToPath } from "node:url";

export const profilesDir = (): string => fileURLToPath(new URL("../profiles", import.meta.url));
