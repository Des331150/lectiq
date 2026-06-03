import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "40mb",
    },
    proxyClientMaxBodySize: "40mb",
  },
};

export default nextConfig;
