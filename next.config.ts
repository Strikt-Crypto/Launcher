import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["postgres", "ioredis", "bullmq"],
  agentRules: false,
  devIndicators: { position: "bottom-right" },
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
