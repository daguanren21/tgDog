// Edge/Web-Crypto 兼容的 token 验签，供 middleware 使用。
// 与 lib/auth.ts 的 issueToken 使用相同的 HMAC-SHA256 算法与 secret。

function secret(): string {
  return process.env.AUTH_SECRET ?? "dev-insecure-secret";
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

async function hmacHex(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const ba = hexToBytes(a);
  const bb = hexToBytes(b);
  let diff = 0;
  for (let i = 0; i < ba.length; i++) diff |= ba[i] ^ bb[i];
  return diff === 0;
}

export async function verifyTokenEdge(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [prefix, ts, sig] = parts;
  const expected = await hmacHex(`${prefix}.${ts}`);
  if (!timingSafeEqualHex(sig, expected)) return false;
  const age = Date.now() - Number(ts);
  return age < 30 * 24 * 60 * 60 * 1000;
}

export const SESSION_COOKIE = "tgdog_session";
