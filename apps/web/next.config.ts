import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@vk/contracts"],
  poweredByHeader: false,
  allowedDevOrigins: ["karsa-desk.com"],
  experimental: { optimizePackageImports: ["lucide-react"] },
};

export default nextConfig;
