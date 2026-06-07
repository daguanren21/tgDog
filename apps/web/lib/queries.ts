import { prisma } from "@tgdog/db";
import type { Prisma } from "@tgdog/db";

const PAGE_SIZE = 30;

export interface MessageFilters {
  sourceId?: string;
  keyword?: string;
  page?: number;
}

export async function getMessages(filters: MessageFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const where: Prisma.MessageWhereInput = {};
  if (filters.sourceId) where.sourceId = filters.sourceId;
  if (filters.keyword) {
    where.text = { contains: filters.keyword, mode: "insensitive" };
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      orderBy: { timestamp: "desc" },
      include: { media: true, source: true },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.message.count({ where }),
  ]);

  return {
    messages,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getEnabledSources() {
  return prisma.source.findMany({
    where: { enabled: true },
    orderBy: { title: "asc" },
  });
}

export async function getDashboardStats() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [today, sources, rules] = await Promise.all([
    prisma.message.count({ where: { timestamp: { gte: since } } }),
    prisma.source.count({ where: { enabled: true } }),
    prisma.rule.count({ where: { enabled: true } }),
  ]);
  return { today, sources, rules };
}
