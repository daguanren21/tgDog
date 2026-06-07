import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "tgdog_session";

function secret(): string {
  return process.env.AUTH_SECRET ?? "dev-insecure-secret";
}

/** 生成签名 token（密码正确后下发） */
export function issueToken(): string {
  const payload = `auth.${Date.now()}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

/** 校验 token 是否有效（签名正确即可，30 天有效） */
export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [prefix, ts, sig] = parts;
  const payload = `${prefix}.${ts}`;
  const expected = createHmac("sha256", secret()).update(payload).digest("hex");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  const age = Date.now() - Number(ts);
  return age < 30 * 24 * 60 * 60 * 1000;
}

export function checkPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD ?? "";
  if (!expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const SESSION_COOKIE = COOKIE_NAME;
