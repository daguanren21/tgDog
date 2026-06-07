import Link from "next/link";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "消息流" },
  { href: "/reports", label: "报告" },
  { href: "/sources", label: "监控源" },
  { href: "/rules", label: "规则" },
  { href: "/accounts", label: "账号" },
  { href: "/settings", label: "设置" },
];

export function Nav() {
  return (
    <nav className="flex items-center gap-1 border-b border-border bg-card px-4 py-2">
      <Link href="/" className="mr-4 font-semibold tracking-tight">
        🐕 tgDog
      </Link>
      <div className="flex items-center gap-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            )}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
