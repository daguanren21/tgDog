import "./load-env.js"; // 必须最先执行：在 db 等模块加载前注入根目录 .env
import { ClientManager } from "./client-manager.js";
import { startLoginServer } from "./login-service.js";
import { env } from "./env.js";

async function main() {
  console.log("[collector] 启动中…");
  console.log(`[collector] 热加载间隔 ${env.reloadIntervalMs}ms`);

  const manager = new ClientManager();
  await manager.start();
  startLoginServer(manager);

  const shutdown = async (sig: string) => {
    console.log(`\n[collector] 收到 ${sig}，正在退出…`);
    await manager.stop();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  console.log("[collector] 运行中。Ctrl+C 退出。");
}

main().catch((err) => {
  console.error("[collector] 致命错误:", err);
  process.exit(1);
});
