import { prisma } from "@tgdog/db";
import { Badge } from "@/components/ui/input";
import { Avatar } from "@/components/avatar";
import { TgLogin } from "./tg-login";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  ACTIVE: "已连接",
  PENDING: "待登录",
  DISCONNECTED: "已断开",
};

export default async function AccountsPage() {
  const accounts = await prisma.account.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold">账号</h1>

      {accounts.length > 0 && (
        <div className="space-y-2">
          {accounts.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <Avatar avatarKey={a.avatarKey} name={a.label} />
              <span className="flex-1 truncate">{a.label}</span>
              {a.tgUsername && (
                <span className="text-xs text-muted-foreground">
                  @{a.tgUsername}
                </span>
              )}
              <Badge>{statusLabel[a.status] ?? a.status}</Badge>
            </div>
          ))}
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold">添加账号</h2>
        <TgLogin
          defaultApiId={process.env.TELEGRAM_API_ID ?? ""}
          defaultApiHash={process.env.TELEGRAM_API_HASH ?? ""}
        />
      </div>
    </div>
  );
}
