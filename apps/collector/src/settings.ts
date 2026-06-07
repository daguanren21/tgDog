import { prisma } from "@tgdog/db";
import { tryDecrypt, type R2Config } from "@tgdog/core";

/** 从 DB Setting 行（优先）或环境变量读取并解密 R2 配置 */
export async function loadR2Config(): Promise<R2Config | null> {
  const s = await prisma.setting.findUnique({ where: { id: "singleton" } });

  const accountId = s?.r2AccountId ?? process.env.R2_ACCOUNT_ID;
  const accessKeyId =
    tryDecrypt(s?.r2AccessKeyEnc) ?? process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey =
    tryDecrypt(s?.r2SecretKeyEnc) ?? process.env.R2_SECRET_ACCESS_KEY;
  const bucket = s?.r2Bucket ?? process.env.R2_BUCKET;
  const publicUrl = s?.r2PublicUrl ?? process.env.R2_PUBLIC_URL;
  const endpoint = s?.r2Endpoint ?? process.env.R2_ENDPOINT;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    return null;
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicUrl,
    endpoint: endpoint || undefined,
  };
}
