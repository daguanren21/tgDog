import { NextResponse, type NextRequest } from "next/server";
import { generateReport } from "@/lib/report";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const dateStr = body.date as string | undefined;
  const scope = (body.scope as string | undefined) ?? "global";
  const date = dateStr ? new Date(dateStr) : new Date();

  const result = await generateReport(date, scope);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
