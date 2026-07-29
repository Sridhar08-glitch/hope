import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@holora/ui", "@holora/auth", "@holora/api-client", "@holora/utils"],
};

export default nextConfig;
