import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { prisma } from "@tgdog/db";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ scope?: string }>;
}

interface Stats {
  messageCount?: number;
  sourceCount?: number;
  topSources?: { title: string; count: number }[];
}

export default async function ReportDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { date } = await params;
  const { scope = "global" } = await searchParams;

  const day = new Date(`${date}T00:00:00`);
  if (Number.isNaN(day.getTime())) notFound();

  const report = await prisma.report.findUnique({
    where: { date_scope: { date: day, scope } },
  });
  if (!report) notFound();

  const stats = (report.stats as Stats) ?? {};

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/reports" className="text-sm text-primary hover:underline">
          ← 报告列表
        </Link>
        <h1 className="text-lg font-semibold">
          {new Date(report.date).toLocaleDateString("zh-CN")} 报告
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold tabular-nums">
              {stats.messageCount ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">消息数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold tabular-nums">
              {stats.sourceCount ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">活跃源</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="truncate text-sm text-muted-foreground">
              模型：{report.model ?? "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      {stats.topSources && stats.topSources.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="mb-2 text-sm font-semibold">活跃来源 Top</div>
            <div className="space-y-1">
              {stats.topSources.map((s) => (
                <div
                  key={s.title}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate">{s.title}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="prose-report pt-4">
          <article className="markdown space-y-3 text-sm leading-relaxed">
            <ReactMarkdown>{report.summaryMarkdown}</ReactMarkdown>
          </article>
        </CardContent>
      </Card>
    </div>
  );
}
