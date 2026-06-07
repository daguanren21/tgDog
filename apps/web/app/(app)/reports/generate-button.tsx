"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function GenerateButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scope: "global" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "生成失败");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={generate} disabled={loading}>
        {loading ? "生成中…（可能需要几十秒）" : "生成今日报告"}
      </Button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
