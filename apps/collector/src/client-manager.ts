import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage, type NewMessageEvent } from "telegram/events/index.js";
import { prisma } from "@tgdog/db";
import { decrypt, type R2Config } from "@tgdog/core";
import { RuleCache } from "./rule-cache.js";
import { handleMessage } from "./handler.js";
import { loadR2Config } from "./settings.js";
import { env } from "./env.js";

interface RunningAccount {
  accountId: string;
  client: TelegramClient;
  removeHandler: () => void;
}

/**
 * 管理所有已登录账号的 GramJS 客户端：连接、监听、热加载规则、媒体入 R2。
 */
export class ClientManager {
  private running = new Map<string, RunningAccount>();
  private ruleCache = new RuleCache();
  private r2: R2Config | null = null;
  private reloadTimer?: NodeJS.Timeout;

  async start(): Promise<void> {
    this.r2 = await loadR2Config();
    if (!this.r2) {
      console.warn("[manager] R2 未配置，媒体将不会被存储（可在 web /settings 配置）");
    }

    await this.syncAccounts();

    // 定期热加载：规则/源 + 新账号 + R2 配置
    this.reloadTimer = setInterval(() => {
      void this.reloadAll();
    }, env.reloadIntervalMs);
  }

  private async reloadAll(): Promise<void> {
    try {
      this.r2 = await loadR2Config();
      for (const acc of this.running.values()) {
        await this.ruleCache.refresh(acc.accountId);
      }
      await this.syncAccounts(); // 接入新登录的账号
    } catch (err) {
      console.error("[manager] reload 出错:", (err as Error).message);
    }
  }

  /** 把 DB 里 ACTIVE 且有 session 的账号都连上 */
  async syncAccounts(): Promise<void> {
    const accounts = await prisma.account.findMany({
      where: { status: "ACTIVE", sessionEnc: { not: null } },
    });

    for (const acc of accounts) {
      if (this.running.has(acc.id)) continue;
      try {
        await this.connectAccount(acc.id, acc.apiId, acc.apiHashEnc, acc.sessionEnc!);
      } catch (err) {
        console.error(
          `[manager] 账号 ${acc.id} 连接失败:`,
          (err as Error).message,
        );
        await prisma.account.update({
          where: { id: acc.id },
          data: { status: "DISCONNECTED" },
        });
      }
    }
  }

  private async connectAccount(
    accountId: string,
    apiId: number,
    apiHashEnc: string,
    sessionEnc: string,
  ): Promise<void> {
    const apiHash = decrypt(apiHashEnc);
    const sessionStr = decrypt(sessionEnc);
    const client = new TelegramClient(
      new StringSession(sessionStr),
      apiId,
      apiHash,
      { connectionRetries: 5, autoReconnect: true },
    );

    await client.connect();
    const me = await client.getMe();
    const meId = me instanceof Api.User ? String(me.id) : undefined;
    console.log(`[manager] 账号 ${accountId} 已连接 (user=${meId})`);

    await this.ruleCache.refresh(accountId);

    const handler = async (event: NewMessageEvent) => {
      try {
        const cache = this.ruleCache.get(accountId);
        if (!cache) return;
        await handleMessage(client, accountId, cache, this.r2, event.message);
      } catch (err) {
        console.error("[manager] 消息处理出错:", (err as Error).message);
      }
    };
    client.addEventHandler(handler, new NewMessage({}));

    await prisma.account.update({
      where: { id: accountId },
      data: { status: "ACTIVE", lastConnectedAt: new Date(), tgUserId: meId },
    });

    this.running.set(accountId, {
      accountId,
      client,
      removeHandler: () => client.removeEventHandler(handler, new NewMessage({})),
    });
  }

  /** 拉取某账号的对话列表，供 web /sources 选择监控源 */
  async listDialogs(accountId: string): Promise<
    { tgChatId: string; title: string; username?: string; type: string }[]
  > {
    const acc = this.running.get(accountId);
    if (!acc) throw new Error("账号未连接");
    const dialogs = await acc.client.getDialogs({ limit: 200 });
    return dialogs
      .map((d) => {
        const entity = d.entity;
        let type = "USER";
        let username: string | undefined;
        if (entity instanceof Api.Channel) {
          type = entity.megagroup ? "GROUP" : "CHANNEL";
          username = entity.username ?? undefined;
        } else if (entity instanceof Api.Chat) {
          type = "GROUP";
        } else if (entity instanceof Api.User) {
          type = "USER";
          username = entity.username ?? undefined;
        }
        return {
          tgChatId: String(d.id ?? entity?.id ?? ""),
          title: d.title ?? username ?? "(未命名)",
          username,
          type,
        };
      })
      .filter((d) => d.tgChatId);
  }

  getClient(accountId: string): TelegramClient | undefined {
    return this.running.get(accountId)?.client;
  }

  async stop(): Promise<void> {
    if (this.reloadTimer) clearInterval(this.reloadTimer);
    for (const acc of this.running.values()) {
      try {
        acc.removeHandler();
        await acc.client.disconnect();
      } catch {
        // ignore
      }
    }
    this.running.clear();
  }
}
