import Link from "next/link";
import { MessageCard } from "@/components/message-card";
import { Card, CardContent } from "@/components/ui/card";
import {
  getDashboardStats,
  getEnabledSources,
  getMessages,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ sourceId?: string; keyword?: string; page?: string }>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = sp.page ? Number.parseInt(sp.page, 10) : 1;

  const [{ messages, totalPages, total }, sources, stats] = await Promise.all([
    getMessages({ sourceId: sp.sourceId, keyword: sp.keyword, page }),
    getEnabledSources(),
    getDashboardStats(),
  ]);

  const qs = (next: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    const merged = { ...sp, ...next };
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== "") params.set(k, String(v));
    }
    return `?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="近 24h 消息" value={stats.today} />
        <Stat label="监控源" value={stats.sources} />
        <Stat label="启用规则" value={stats.rules} />
      </div>

      {/* 过滤栏 */}
      <form className="flex flex-wrap items-center gap-2" action="/" method="get">
        <select
          name="sourceId"
          defaultValue={sp.sourceId ?? ""}
          className="h-9 rounded-md border border-border bg-muted px-2 text-sm"
        >
          <option value="">全部来源</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
        <input
          name="keyword"
          defaultValue={sp.keyword ?? ""}
          placeholder="搜索关键词…"
          className="h-9 w-48 rounded-md border border-border bg-muted px-3 text-sm placeholder:text-muted-foreground"
        />
        <button className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">
          筛选
        </button>
        {(sp.sourceId || sp.keyword) && (
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            清除
          </Link>
        )}
      </form>

      {/* 消息列表 */}
      {messages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            还没有命中的消息。确认 collector 已连接、监控源与规则已配置。
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <MessageCard
              key={m.id}
              senderName={m.senderName}
              sourceTitle={m.source.title}
              text={m.text}
              timestamp={m.timestamp}
              isForwarded={m.isForwarded}
              media={m.media}
            />
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2 text-sm">
          {page > 1 && (
            <Link href={qs({ page: page - 1 })} className="text-primary hover:underline">
              ← 上一页
            </Link>
          )}
          <span className="text-muted-foreground">
            {page} / {totalPages}（共 {total}）
          </span>
          {page < totalPages && (
            <Link href={qs({ page: page + 1 })} className="text-primary hover:underline">
              下一页 →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
