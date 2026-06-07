import OpenAI from "openai";
import { prisma } from "@tgdog/db";
import { tryDecrypt } from "@tgdog/core";

export interface AiConfig {
  baseURL: string;
  apiKey: string;
  model: string;
}

/** 从 Setting 行（优先）或 env 读取 AI 配置 */
export async function loadAiConfig(): Promise<AiConfig | null> {
  const s = await prisma.setting.findUnique({ where: { id: "singleton" } });
  const baseURL = s?.aiBaseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const apiKey = tryDecrypt(s?.aiApiKeyEnc) || process.env.OPENAI_API_KEY || "";
  const model = s?.aiModel || process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (!apiKey) return null;
  return { baseURL, apiKey, model };
}

export function makeClient(cfg: AiConfig): OpenAI {
  return new OpenAI({ baseURL: cfg.baseURL, apiKey: cfg.apiKey });
}

/** 单次对话补全，返回文本 */
export async function complete(
  cfg: AiConfig,
  system: string,
  user: string,
): Promise<string> {
  const client = makeClient(cfg);
  const res = await client.chat.completions.create({
    model: cfg.model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.3,
  });
  return res.choices[0]?.message?.content ?? "";
}
