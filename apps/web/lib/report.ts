import { prisma } from "@tgdog/db";
import type { Prisma } from "@tgdog/db";
import { complete, loadAiConfig, type AiConfig } from "./ai";

export interface Topic {
  title: string;
  summary: string;
  count: number;
}

export interface ReportStats {
  messageCount: number;
  sourceCount: number;
  topSources: { title: string; count: number }[];
}

interface MsgRow {
  text: string;
  sourceTitle: string;
  senderName: string | null;
  timestamp: Date;
}

const CHUNK = 60; // 每批喂给模型的消息条数

function dayWindow(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function formatMsgs(rows: MsgRow[]): string {
  return rows
    .map(
      (m) =>
        `[${m.sourceTitle}]${m.senderName ? ` ${m.senderName}:` : ""} ${m.text.replace(/\n/g, " ").slice(0, 300)}`,
    )
    .join("\n");
}

const SYSTEM_CHUNK =
  "你是一个 Telegram 消息分析助手。请把下面一批消息浓缩成要点（中文），保留关键事件、数字、链接含义。输出简洁的 bullet 列表，不要寒暄。";

const SYSTEM_FINAL =
  "你是一个情报汇总助手。基于多批消息要点，输出一份当日报告（中文 Markdown），包含：1) 总体概述（3-5 句）；2) 按主题分组的要点（用 ## 小标题）；3) 值得关注的重点。简洁、信息密度高，不要寒暄。";

async function summarizeChunks(
  cfg: AiConfig,
  rows: MsgRow[],
): Promise<string> {
  if (rows.length <= CHUNK) {
    return complete(cfg, SYSTEM_FINAL, formatMsgs(rows));
  }
  // map：分批要点
  const partials: string[] = [];
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    partials.push(await complete(cfg, SYSTEM_CHUNK, formatMsgs(chunk)));
  }
  // reduce：合并成最终报告
  return complete(
    cfg,
    SYSTEM_FINAL,
    `以下是当日各批消息的要点，请汇总：\n\n${partials.join("\n\n---\n\n")}`,
  );
}

/**
 * 生成某日报告。scope = "global" 或 source id。
 */
export async function generateReport(
  date: Date,
  scope = "global",
): Promise<{ ok: boolean; error?: string; reportId?: string }> {
  const cfg = await loadAiConfig();
  if (!cfg) return { ok: false, error: "AI 未配置（请在设置里填写 API Key）" };

  const { start, end } = dayWindow(date);
  const where = {
    timestamp: { gte: start, lt: end },
    ...(scope !== "global" ? { sourceId: scope } : {}),
  };

  const messages = await prisma.message.findMany({
    where,
    orderBy: { timestamp: "asc" },
    include: { source: true },
  });

  if (messages.length === 0) {
    return { ok: false, error: "该日没有消息可汇总" };
  }

  const rows: MsgRow[] = messages.map((m) => ({
    text: m.text,
    sourceTitle: m.source.title,
    senderName: m.senderName,
    timestamp: m.timestamp,
  }));

  // 统计
  const bySource = new Map<string, number>();
  for (const m of messages) {
    bySource.set(m.source.title, (bySource.get(m.source.title) ?? 0) + 1);
  }
  const topSources = [...bySource.entries()]
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const stats: ReportStats = {
    messageCount: messages.length,
    sourceCount: bySource.size,
    topSources,
  };

  let summaryMarkdown: string;
  try {
    summaryMarkdown = await summarizeChunks(cfg, rows);
  } catch (e) {
    return { ok: false, error: `AI 调用失败：${(e as Error).message}` };
  }

  const report = await prisma.report.upsert({
    where: { date_scope: { date: start, scope } },
    update: {
      summaryMarkdown,
      stats: stats as unknown as Prisma.InputJsonValue,
      model: cfg.model,
      windowStart: start,
      windowEnd: end,
    },
    create: {
      date: start,
      windowStart: start,
      windowEnd: end,
      scope,
      summaryMarkdown,
      topics: [],
      stats: stats as unknown as Prisma.InputJsonValue,
      model: cfg.model,
    },
  });

  // 标记已汇总
  await prisma.message.updateMany({
    where,
    data: { needsSummary: false },
  });

  return { ok: true, reportId: report.id };
}
