// 必须在任何其他模块（尤其是 @tgdog/db，它在加载时就读 process.env.DATABASE_URL）
// 之前先把 monorepo 根目录的 .env 注入 process.env。
// collector 由 `pnpm --filter` 在 apps/collector 下启动，cwd 不是根目录，
// 所以显式指向根目录的 .env（apps/collector/src → ../../../.env）。
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, "../../../.env") });
