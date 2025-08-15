import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  env: {
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  },
  eslint: {
    // Disable ESLint during production builds or when SKIP_LINT is set
    ignoreDuringBuilds: process.env.NODE_ENV === 'production' || process.env.SKIP_LINT === 'true',
  },
  // Optional: Also disable TypeScript type checking if needed
  // typescript: {
  //   ignoreBuildErrors: process.env.NODE_ENV === 'production',
  // },
};

export default nextConfig;
