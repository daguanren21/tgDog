import Link from "next/link";
import { prisma } from "@tgdog/db";
import { Card, CardContent } from "@/components/ui/card";
import { GenerateButton } from "./generate-button";

export const dynamic = "force-dynamic";

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("zh-CN");
}

interface Stats {
  messageCount?: number;
  sourceCount?: number;
}

export default async function ReportsPage() {
  const reports = await prisma.report.findMany({
    orderBy: { date: "desc" },
    take: 60,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">每日报告</h1>
        <GenerateButton />
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            还没有报告。点「生成今日报告」开始。
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => {
            const stats = (r.stats as Stats) ?? {};
            const dateKey = new Date(r.date).toISOString().slice(0, 10);
            return (
              <Link
                key={r.id}
                href={`/reports/${dateKey}${r.scope !== "global" ? `?scope=${r.scope}` : ""}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm hover:bg-muted"
              >
                <span className="font-medium tabular-nums">{fmtDate(r.date)}</span>
                <span className="text-xs text-muted-foreground">
                  {r.scope === "global" ? "全局" : "单源"}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {stats.messageCount ?? 0} 条 · {stats.sourceCount ?? 0} 源
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
