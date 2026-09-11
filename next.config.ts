import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Retries navigations/prefetches/Server Actions automatically once
    // connectivity returns, instead of throwing — belt-and-suspenders on top
    // of the durable IndexedDB queue used for stage changes/notes/quick-logs.
    useOffline: true,
  },
};

export default nextConfig;
