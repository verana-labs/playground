"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The use case used to be one page with #section-N / #need-N anchors.
// Old links land on chapter 1; forward them to the right chapter.
export default function LegacyHash() {
  const router = useRouter();
  useEffect(() => {
    const h = window.location.hash;
    if (!h) return;
    if (h.startsWith("#need-") || h === "#section-3") {
      router.replace(`/usecases/vesta/journey${h.startsWith("#need-") ? h : ""}`);
    } else if (h === "#section-2") {
      router.replace("/usecases/vesta/solution");
    } else if (h === "#section-4" || h.startsWith("#section-4-")) {
      router.replace(`/usecases/vesta/demos${h.startsWith("#section-4-") ? h : ""}`);
    }
  }, [router]);
  return null;
}
