import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // 容器部署用 standalone 产物
  output: "standalone",
  // monorepo：把追踪根设到仓库根，standalone 才会带上 workspace 依赖
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
  // 共享 workspace 包（含 Prisma 生成的 TS client）需要被转译
  transpilePackages: ["@tgdog/db", "@tgdog/core"],
  // Prisma 运行时不打包进 bundle
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg"],
  // 避免 barrel import 全量加载，优化构建与冷启动
  experimental: {
    optimizePackageImports: ["react-markdown"],
  },
  images: {
    // 允许 R2 公开域名的图片（运行时再按需放开具体域名）
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
