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
    ];
  },
};

export default nextConfig;
