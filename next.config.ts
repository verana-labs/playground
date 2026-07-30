import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
      {
        source: "/cloud-wallets/:path*",
        destination: "/business-wallets/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
