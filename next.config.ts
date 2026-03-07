import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // This handles the warning you saw
    allowedDevOrigins: ['*']
  }
};

export default nextConfig;
