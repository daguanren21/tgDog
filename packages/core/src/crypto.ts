import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const SALT_LEN = 16;

/**
 * 从 ENCRYPTION_KEY 派生 32 字节密钥。ENCRYPTION_KEY 应为足够长的随机字符串。
 */
function deriveKey(salt: Buffer): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 16) {
    throw new Error(
      "ENCRYPTION_KEY 未设置或过短（至少 16 字符）。用于加密 Telegram session 与密钥。",
    );
  }
  return scryptSync(secret, salt, 32);
}

/**
 * 加密明文，返回 base64 字符串（salt + iv + authTag + ciphertext）。
 */
export function encrypt(plaintext: string): string {
  const salt = randomBytes(SALT_LEN);
  const iv = randomBytes(IV_LEN);
  const key = deriveKey(salt);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([salt, iv, authTag, ciphertext]).toString("base64");
}

/**
 * 解密由 encrypt 生成的 base64 字符串。
 */
export function decrypt(payload: string): string {
  const data = Buffer.from(payload, "base64");
  const salt = data.subarray(0, SALT_LEN);
  const iv = data.subarray(SALT_LEN, SALT_LEN + IV_LEN);
  const authTag = data.subarray(SALT_LEN + IV_LEN, SALT_LEN + IV_LEN + 16);
  const ciphertext = data.subarray(SALT_LEN + IV_LEN + 16);
  const key = deriveKey(salt);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

/** 安全解密：失败返回 null，便于处理坏数据 */
export function tryDecrypt(payload: string | null | undefined): string | null {
  if (!payload) return null;
  try {
    return decrypt(payload);
  } catch {
    return null;
  }
}
