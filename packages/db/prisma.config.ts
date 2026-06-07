import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// 从仓库根目录加载 .env（再回退到本包目录），让 generate/migrate 复用同一份配置
config({ path: "../../.env" });
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
