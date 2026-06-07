"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveSettings, type SettingsInput } from "./actions";

interface Props {
  initial: {
    r2AccountId: string;
    r2Bucket: string;
    r2Endpoint: string;
    r2PublicUrl: string;
    hasR2AccessKey: boolean;
    hasR2SecretKey: boolean;
    aiBaseUrl: string;
    aiModel: string;
    hasAiApiKey: boolean;
  };
}

export function SettingsForm({ initial }: Props) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<SettingsInput>({
    r2AccountId: initial.r2AccountId,
    r2Bucket: initial.r2Bucket,
    r2Endpoint: initial.r2Endpoint,
    r2PublicUrl: initial.r2PublicUrl,
    aiBaseUrl: initial.aiBaseUrl,
    aiModel: initial.aiModel,
  });

  function set<K extends keyof SettingsInput>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveSettings(form);
        setSaved(true);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  const field = (
    label: string,
    key: keyof SettingsInput,
    placeholder?: string,
    type = "text",
  ) => (
    <label className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Input
        type={type}
        value={(form[key] as string) ?? ""}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Cloudflare R2（媒体存储）</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {field("Account ID", "r2AccountId")}
          {field("Bucket", "r2Bucket")}
          {field(
            `Access Key${initial.hasR2AccessKey ? "（已设置，留空不改）" : ""}`,
            "r2AccessKey",
            initial.hasR2AccessKey ? "••••••" : "",
            "password",
          )}
          {field(
            `Secret Key${initial.hasR2SecretKey ? "（已设置，留空不改）" : ""}`,
            "r2SecretKey",
            initial.hasR2SecretKey ? "••••••" : "",
            "password",
          )}
          {field("Endpoint（可选）", "r2Endpoint", "默认按 Account ID 拼接")}
          {field("Public URL", "r2PublicUrl", "https://media.example.com")}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">AI（OpenAI 兼容接口）</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {field("Base URL", "aiBaseUrl", "https://api.openai.com/v1")}
          {field("Model", "aiModel", "gpt-4o-mini")}
          {field(
            `API Key${initial.hasAiApiKey ? "（已设置，留空不改）" : ""}`,
            "aiApiKey",
            initial.hasAiApiKey ? "••••••" : "",
            "password",
          )}
        </div>
      </section>

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-success">已保存</p>}
      <Button onClick={submit} disabled={pending}>
        {pending ? "保存中…" : "保存设置"}
      </Button>
    </div>
  );
}
