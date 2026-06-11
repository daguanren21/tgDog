"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@tgdog/db";
import type { SourceType } from "@tgdog/db";
import { collector } from "@/lib/collector";

/** 从 collector 拉取账号的对话列表 */
export async function fetchDialogs(accountId: string) {
  const { dialogs } = await collector.dialogs(accountId);
  return dialogs as {
    tgChatId: string;
    title: string;
    username?: string;
    type: string;
    avatarKey?: string;
  }[];
}

/** 添加/更新一个监控源 */
export async function addSource(input: {
  accountId: string;
  tgChatId: string;
  title: string;
  username?: string;
  type: SourceType;
  avatarKey?: string;
}) {
  await prisma.source.upsert({
    where: {
      accountId_tgChatId: {
        accountId: input.accountId,
        tgChatId: input.tgChatId,
      },
    },
    update: {
      enabled: true,
      title: input.title,
      username: input.username,
      ...(input.avatarKey ? { avatarKey: input.avatarKey } : {}),
    },
    create: {
      accountId: input.accountId,
      tgChatId: input.tgChatId,
      title: input.title,
      username: input.username,
      type: input.type,
      enabled: true,
      avatarKey: input.avatarKey ?? null,
    },
  });
  revalidatePath("/sources");
}

export async function toggleSource(id: string, enabled: boolean) {
  await prisma.source.update({ where: { id }, data: { enabled } });
  revalidatePath("/sources");
}

export async function deleteSource(id: string) {
  await prisma.source.delete({ where: { id } });
  revalidatePath("/sources");
}
