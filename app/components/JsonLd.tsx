import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  LINKS,
} from "../lib/site";

/**
 * schema.org structured data, mirroring the verana.io site's JSON-LD graph:
 * the Verana organization, this WebSite, and the playground as a free
 * WebApplication running against the Verana testnet.
 */
export default function JsonLd() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Verana",
        url: LINKS.veranaIo,
        sameAs: [LINKS.foundation, LINKS.docs, LINKS.github],
        logo: `${SITE_URL}/icon.svg`,
      },
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        publisher: {
          "@type": "Organization",
          name: "Verana Foundation",
          url: LINKS.foundation,
        },
      },
      {
        "@type": "WebApplication",
        name: SITE_NAME,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        url: SITE_URL,
        description:
          "Interactive playground for the Verana open trust layer: follow the Vesta Appliances use case, then exercise live issuers and verifiers on the Verana testnet with your own wallet.",
      },
      {
        "@type": "TechArticle",
        headline: "Verifiable Trust Specification",
        url: LINKS.vtSpec,
        author: { "@type": "Organization", name: "Verana Foundation" },
        about: [
          "Verifiable Credentials",
          "Decentralized Identifiers",
          "Trust Registries",
          "Verifiable Services",
          "Verifiable User Agents",
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // JSON-LD must be embedded raw; content is entirely from our constants.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
