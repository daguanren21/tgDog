# Collector worker —— 常驻 GramJS 进程
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

# 安装依赖（利用 layer 缓存）
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/db/package.json packages/db/
COPY packages/core/package.json packages/core/
COPY apps/collector/package.json apps/collector/
RUN pnpm install --frozen-lockfile || pnpm install

# 拷贝源码
COPY packages ./packages
COPY apps/collector ./apps/collector

# 生成 Prisma client
RUN cd packages/db && pnpm exec prisma generate

EXPOSE 8787
CMD ["pnpm", "--filter", "@tgdog/collector", "start"]
