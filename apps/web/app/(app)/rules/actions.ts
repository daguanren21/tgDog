"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@tgdog/db";
import type { MatchType, ScopeMode } from "@tgdog/db";

export interface RuleInput {
  name: string;
  keyword?: string;
  matchType: MatchType;
  caseSensitive: boolean;
  scopeMode: ScopeMode;
  sourceIds: string[]; // scopeMode=SELECTED 时生效
  mediaOnly: boolean;
  senderFilter?: { mode: "whitelist" | "blacklist"; ids: string[] } | null;
}

export async function createRule(input: RuleInput) {
  await prisma.rule.create({
    data: {
      name: input.name,
      keyword: input.keyword || null,
      matchType: input.matchType,
      caseSensitive: input.caseSensitive,
      scopeMode: input.scopeMode,
      sources:
        input.scopeMode === "SELECTED" && input.sourceIds.length > 0
          ? { connect: input.sourceIds.map((id) => ({ id })) }
          : undefined,
      mediaOnly: input.mediaOnly,
      senderFilter: input.senderFilter ?? undefined,
      enabled: true,
    },
  });
  revalidatePath("/rules");
}

export async function toggleRule(id: string, enabled: boolean) {
  await prisma.rule.update({ where: { id }, data: { enabled } });
  revalidatePath("/rules");
}

export async function deleteRule(id: string) {
  await prisma.rule.delete({ where: { id } });
  revalidatePath("/rules");
}
