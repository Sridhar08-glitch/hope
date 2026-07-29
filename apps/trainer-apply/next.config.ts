import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@holora/api-client",
    "@holora/auth",
    "@holora/ui",
    "@holora/utils",
  ],
};

export default nextConfig;
