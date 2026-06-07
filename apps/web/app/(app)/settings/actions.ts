"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@tgdog/db";
import { encrypt } from "@tgdog/core";

export interface SettingsInput {
  // R2
  r2AccountId?: string;
  r2AccessKey?: string; // 明文，提交时加密；留空表示不修改
  r2SecretKey?: string;
  r2Bucket?: string;
  r2Endpoint?: string;
  r2PublicUrl?: string;
  // AI
  aiBaseUrl?: string;
  aiApiKey?: string; // 明文，提交时加密；留空表示不修改
  aiModel?: string;
}

export async function saveSettings(input: SettingsInput) {
  const existing = await prisma.setting.findUnique({
    where: { id: "singleton" },
  });

  const data = {
    r2AccountId: input.r2AccountId || null,
    r2Bucket: input.r2Bucket || null,
    r2Endpoint: input.r2Endpoint || null,
    r2PublicUrl: input.r2PublicUrl || null,
    aiBaseUrl: input.aiBaseUrl || null,
    aiModel: input.aiModel || null,
    // 密钥：仅在提供了新值时更新（避免被空值覆盖）
    r2AccessKeyEnc: input.r2AccessKey
      ? encrypt(input.r2AccessKey)
      : (existing?.r2AccessKeyEnc ?? null),
    r2SecretKeyEnc: input.r2SecretKey
      ? encrypt(input.r2SecretKey)
      : (existing?.r2SecretKeyEnc ?? null),
    aiApiKeyEnc: input.aiApiKey
      ? encrypt(input.aiApiKey)
      : (existing?.aiApiKeyEnc ?? null),
  };

  await prisma.setting.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });
  revalidatePath("/settings");
}
