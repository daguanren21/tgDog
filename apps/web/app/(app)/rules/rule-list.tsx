"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/input";
import { deleteRule, toggleRule } from "./actions";

interface RuleItem {
  id: string;
  name: string;
  keyword: string | null;
  matchType: string;
  enabled: boolean;
  mediaOnly: boolean;
  scopeMode: string;
  sourceTitles: string[];
}

const matchLabel: Record<string, string> = {
  PARTIAL: "模糊",
  EXACT: "精确",
  REGEX: "正则",
};

function scopeText(scopeMode: string, titles: string[]): string {
  if (scopeMode === "ALL") return "全部源";
  if (titles.length === 0) return "未选源";
  if (titles.length <= 2) return titles.join("、");
  return `${titles.slice(0, 2).join("、")} 等 ${titles.length} 个`;
}

export function RuleList({ rules }: { rules: RuleItem[] }) {
  const [pending, startTransition] = useTransition();

  if (rules.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        还没有规则。添加一个开始采集。
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {rules.map((r) => (
        <div
          key={r.id}
          className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{r.name}</span>
              <Badge>{matchLabel[r.matchType] ?? r.matchType}</Badge>
              {r.mediaOnly ? <Badge>媒体</Badge> : null}
              <Badge>{scopeText(r.scopeMode, r.sourceTitles)}</Badge>
            </div>
            {r.keyword && (
              <div className="truncate text-xs text-muted-foreground">
                关键词：{r.keyword}
              </div>
            )}
          </div>
          <button
            disabled={pending}
            onClick={() =>
              startTransition(() => toggleRule(r.id, !r.enabled).then(() => {}))
            }
            className={`rounded-md px-2 py-1 text-xs ${
              r.enabled
                ? "bg-success/20 text-success"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {r.enabled ? "启用中" : "已停用"}
          </button>
          <button
            disabled={pending}
            onClick={() =>
              startTransition(() => deleteRule(r.id).then(() => {}))
            }
            className="text-xs text-danger hover:underline"
          >
            删除
          </button>
        </div>
      ))}
    </div>
  );
}
