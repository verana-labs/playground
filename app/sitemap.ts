import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/site";
import { businessWallets } from "./lib/integrations";
import { CHAPTERS_NAV } from "./usecases/vesta/chapters";
import { CHAPTERS_NAV as UTOPIA_CHAPTERS } from "./usecases/utopia/chapters";

// Every statically generated route: the fixed pages, the Vesta story
// chapters, and one page per integrated business wallet.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const routes = [
    "",
    "/personal-wallets",
    "/business-wallets",
    "/integrate",
    "/about",
    "/usecases/mosip",
    ...CHAPTERS_NAV.map((c) => c.href),
    ...UTOPIA_CHAPTERS.map((c) => c.href),
    ...businessWallets().map((w) => `/business-wallets/${w.slug}`),
  ];
  return [...new Set(routes)].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
