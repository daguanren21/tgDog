import { prisma } from "@tgdog/db";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const s = await prisma.setting.findUnique({ where: { id: "singleton" } });

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold">设置</h1>
      <SettingsForm
        initial={{
          r2AccountId: s?.r2AccountId ?? "",
          r2Bucket: s?.r2Bucket ?? "",
          r2Endpoint: s?.r2Endpoint ?? "",
          r2PublicUrl: s?.r2PublicUrl ?? "",
          hasR2AccessKey: !!s?.r2AccessKeyEnc,
          hasR2SecretKey: !!s?.r2SecretKeyEnc,
          aiBaseUrl: s?.aiBaseUrl ?? "",
          aiModel: s?.aiModel ?? "gpt-4o-mini",
          hasAiApiKey: !!s?.aiApiKeyEnc,
        }}
      />
    </div>
  );
}
