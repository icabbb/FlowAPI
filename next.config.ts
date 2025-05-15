import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["img.clerk.com", "images.clerk.dev"],
  },
};

export default nextConfig;
