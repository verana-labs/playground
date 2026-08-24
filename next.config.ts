import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  async redirects() {
    return [
      { source: "/explained", destination: "/usecases/vesta", permanent: true },
      {
        source: "/explained/:path*",
        destination: "/usecases/vesta",
        permanent: true,
      },
      // FIDES vocabulary rename: user wallets -> personal wallets,
      // cloud wallets -> business wallets.
      {
        source: "/user-wallets/:path*",
        destination: "/personal-wallets/:path*",
        permanent: true,
      },
      // Single personal-wallets page: old per-wallet URLs deep-link into it.
      {
        source: "/personal-wallets/:slug",
        destination: "/personal-wallets?wallet=:slug",
        permanent: true,
      },
      {
        source: "/cloud-wallets/:path*",
        destination: "/business-wallets/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
