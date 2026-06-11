import { NextResponse, type NextRequest } from "next/server";
import { checkPassword, issueToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  // [临时调试] 打印进程实际读到的密码信息，定位 401 根因
  console.log(
    "[auth-debug] 收到密码=%j 长度=%d | env.APP_PASSWORD=%j 长度=%d",
    String(password ?? ""),
    String(password ?? "").length,
    process.env.APP_PASSWORD,
    (process.env.APP_PASSWORD ?? "").length,
  );
  if (!checkPassword(String(password ?? ""))) {
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, issueToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
