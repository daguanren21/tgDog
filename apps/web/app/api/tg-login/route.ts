import { NextResponse, type NextRequest } from "next/server";
import { collector } from "@/lib/collector";

// 代理到 collector 登录服务（密钥保留在服务端）
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    switch (action) {
      case "qrStart":
        return NextResponse.json(
          await collector.qrStart(Number(body.apiId), String(body.apiHash)),
        );
      case "codeStart":
        return NextResponse.json(
          await collector.codeStart(
            Number(body.apiId),
            String(body.apiHash),
            String(body.phone),
          ),
        );
      case "codeSubmit":
        return NextResponse.json(
          await collector.codeSubmit(String(body.loginId), String(body.code)),
        );
      case "password":
        return NextResponse.json(
          await collector.submitPassword(
            String(body.loginId),
            String(body.password),
          ),
        );
      default:
        return NextResponse.json({ error: "未知操作" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const loginId = req.nextUrl.searchParams.get("loginId") ?? "";
  try {
    return NextResponse.json(await collector.status(loginId));
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
