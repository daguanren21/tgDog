import { prisma } from "@tgdog/db";
import { SourceManager } from "./source-manager";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const [accounts, sources] = await Promise.all([
    prisma.account.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.source.findMany({ orderBy: { addedAt: "desc" } }),
  ]);

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold">监控源</h1>
      <SourceManager
        accounts={accounts.map((a) => ({ id: a.id, label: a.label }))}
        existing={sources.map((s) => ({
          id: s.id,
          tgChatId: s.tgChatId,
          title: s.title,
          type: s.type,
          enabled: s.enabled,
          avatarKey: s.avatarKey,
        }))}
      />
    </div>
  );
}
