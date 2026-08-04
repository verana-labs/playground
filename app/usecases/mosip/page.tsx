import type { Metadata } from "next";

import MosipShowcase from "./MosipShowcase";

export const metadata: Metadata = {
  title: "MOSIP × Verana · Verana Playground",
  description:
    "Real MOSIP Inji components with a Verana trust layer on top: resolve the issuer and the verifier against the public registry, live, before anything is issued or shared.",
};

export default function Page() {
  return <MosipShowcase />;
}
