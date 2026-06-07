import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "tgDog · Telegram 监控",
  description: "监控、汇总、分析你关注的 Telegram 消息",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
