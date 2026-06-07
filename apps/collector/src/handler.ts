import { Api } from "telegram";
import type { TelegramClient } from "telegram";
import { prisma } from "@tgdog/db";
import {
  buildMediaKey,
  matchedRuleIds,
  uploadBuffer,
  type MessageLike,
  type R2Config,
} from "@tgdog/core";
import { extractMediaMeta, downloadMediaBuffer } from "./media.js";
import type { AccountCache } from "./rule-cache.js";

/** 把 GramJS chatId（可能是 bigInt/负数）规范成字符串 */
function chatIdStr(msg: Api.Message): string {
  const id = msg.chatId ?? msg.peerId;
  return String(id ?? "");
}

interface SenderInfo {
  id?: string;
  name?: string;
  username?: string;
}

async function resolveSender(msg: Api.Message): Promise<SenderInfo> {
  try {
    const sender = await msg.getSender();
    if (!sender) return { id: msg.senderId ? String(msg.senderId) : undefined };
    if (sender instanceof Api.User) {
      const name = [sender.firstName, sender.lastName]
        .filter(Boolean)
        .join(" ");
      return {
        id: String(sender.id),
        name: name || sender.username || undefined,
        username: sender.username ?? undefined,
      };
    }
    if (sender instanceof Api.Channel || sender instanceof Api.Chat) {
      return {
        id: String(sender.id),
        name: sender.title,
        username:
          sender instanceof Api.Channel
            ? (sender.username ?? undefined)
            : undefined,
      };
    }
  } catch {
    // ignore
  }
  return { id: msg.senderId ? String(msg.senderId) : undefined };
}

/**
 * 处理一条新消息：判断是否在监控源 → 规则匹配 → 媒体下载入 R2 → 入库。
 * @returns 是否入库
 */
export async function handleMessage(
  client: TelegramClient,
  accountId: string,
  cache: AccountCache,
  r2: R2Config | null,
  msg: Api.Message,
): Promise<boolean> {
  const chatId = chatIdStr(msg);
  const source = cache.sourcesByChatId.get(chatId);
  if (!source) return false; // 不在监控源

  const mediaMeta = extractMediaMeta(msg);
  const text = msg.message ?? "";

  const sender = await resolveSender(msg);
  const msgLike: MessageLike = {
    text,
    hasMedia: !!mediaMeta,
    senderId: sender.id,
    senderUsername: sender.username,
    sourceId: source.id,
  };

  const ruleIds = matchedRuleIds(cache.rules, msgLike);
  if (ruleIds.length === 0) return false; // 未命中任何规则

  const timestamp = new Date((msg.date ?? 0) * 1000);
  const isForwarded = !!msg.fwdFrom;

  // 先 upsert 消息（避免重复），拿到 messageId 用于媒体 key
  let saved;
  try {
    saved = await prisma.message.upsert({
      where: {
        accountId_tgChatId_tgMessageId: {
          accountId,
          tgChatId: chatId,
          tgMessageId: String(msg.id),
        },
      },
      update: { matchedRuleIds: ruleIds },
      create: {
        accountId,
        sourceId: source.id,
        tgMessageId: String(msg.id),
        tgChatId: chatId,
        senderId: sender.id,
        senderName: sender.name,
        senderUsername: sender.username,
        text,
        timestamp,
        isForwarded,
        matchedRuleIds: ruleIds,
        needsSummary: true,
      },
    });
  } catch (err) {
    console.error("[handler] 入库失败:", (err as Error).message);
    return false;
  }

  // 媒体：下载 → R2 → Media 记录
  if (mediaMeta && r2) {
    const buffer = await downloadMediaBuffer(client, msg);
    if (buffer) {
      try {
        const key = buildMediaKey(
          saved.id,
          mediaMeta.fileName,
          timestamp.toISOString(),
        );
        const url = await uploadBuffer(r2, key, buffer, mediaMeta.mimeType);
        await prisma.media.create({
          data: {
            messageId: saved.id,
            type: mediaMeta.type,
            r2Key: key,
            r2Url: url,
            fileName: mediaMeta.fileName,
            fileSize: mediaMeta.fileSize ?? buffer.length,
            mimeType: mediaMeta.mimeType,
            width: mediaMeta.width,
            height: mediaMeta.height,
          },
        });
      } catch (err) {
        console.error("[handler] 媒体上传失败:", (err as Error).message);
      }
    }
  } else if (mediaMeta && !r2) {
    console.warn("[handler] 有媒体但 R2 未配置，跳过媒体存储");
  }

  console.log(
    `[match] ${source.tgChatId} 命中 ${ruleIds.length} 规则: "${text.slice(0, 50)}"`,
  );
  return true;
}
