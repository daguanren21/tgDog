import { prisma } from "@tgdog/db";
import { RuleForm } from "./rule-form";
import { RuleList } from "./rule-list";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const [rules, sources] = await Promise.all([
    prisma.rule.findMany({
      orderBy: { createdAt: "desc" },
      include: { sources: { select: { title: true } } },
    }),
    prisma.source.findMany({
      where: { enabled: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold">规则 / 主题</h1>
      <RuleForm sources={sources.map((s) => ({ id: s.id, title: s.title }))} />
      <RuleList
        rules={rules.map((r) => ({
          id: r.id,
          name: r.name,
          keyword: r.keyword,
          matchType: r.matchType,
          enabled: r.enabled,
          mediaOnly: r.mediaOnly,
          scopeMode: r.scopeMode,
          sourceTitles: r.sources.map((s) => s.title),
        }))}
      />
    </div>
  );
}
