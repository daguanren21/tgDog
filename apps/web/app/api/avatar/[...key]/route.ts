import { NextResponse, type NextRequest } from "next/server";
import { getObject } from "@tgdog/core";
import { loadR2Config } from "@/lib/r2";

export const dynamic = "force-dynamic";

/**
 * 私有 R2 桶头像代理读取：/api/avatar/avatars/<kind>/<id>.jpg
 * 仅允许 avatars/ 前缀，禁止目录穿越。
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: segments } = await params;
  const key = segments.join("/");

  // 安全校验：必须以 avatars/ 开头，且不含路径穿越
  if (!key.startsWith("avatars/") || key.includes("..")) {
    return NextResponse.json({ error: "非法 key" }, { status: 400 });
  }

  const cfg = await loadR2Config();
  if (!cfg) {
    return NextResponse.json({ error: "R2 未配置" }, { status: 404 });
  }

  const obj = await getObject(cfg, key);
  if (!obj) {
    return NextResponse.json({ error: "头像不存在" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(obj.body), {
    status: 200,
    headers: {
      "content-type": obj.contentType ?? "image/jpeg",
      "cache-control": "public, max-age=86400",
    },
  });
}
