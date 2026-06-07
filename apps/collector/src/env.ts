import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`缺少环境变量 ${name}`);
  return v;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  encryptionKey: required("ENCRYPTION_KEY"),
  internalApiSecret: process.env.INTERNAL_API_SECRET ?? "",
  loginPort: Number.parseInt(process.env.COLLECTOR_LOGIN_PORT ?? "8787", 10),
  // 规则/源热加载轮询间隔（毫秒）
  reloadIntervalMs: Number.parseInt(
    process.env.COLLECTOR_RELOAD_MS ?? "15000",
    10,
  ),
};
