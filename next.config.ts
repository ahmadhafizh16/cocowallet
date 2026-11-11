import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Private Compose hostname used by real-browser tests; do not allow arbitrary origins.
  allowedDevOrigins: ["wallet.test"],
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
