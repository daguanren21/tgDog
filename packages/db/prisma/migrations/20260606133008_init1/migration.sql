-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('CHANNEL', 'GROUP', 'USER');

-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('EXACT', 'PARTIAL', 'REGEX');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('PHOTO', 'VIDEO', 'DOCUMENT', 'AUDIO', 'VOICE', 'OTHER');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'default',
    "phone" TEXT,
    "apiId" INTEGER NOT NULL,
    "apiHashEnc" TEXT NOT NULL,
    "sessionEnc" TEXT,
    "tgUserId" TEXT,
    "tgUsername" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "lastConnectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "tgChatId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "username" TEXT,
    "type" "SourceType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sourceId" TEXT,
    "keyword" TEXT,
    "matchType" "MatchType" NOT NULL DEFAULT 'PARTIAL',
    "caseSensitive" BOOLEAN NOT NULL DEFAULT false,
    "senderFilter" JSONB,
    "mediaOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "tgMessageId" TEXT NOT NULL,
    "tgChatId" TEXT NOT NULL,
    "senderId" TEXT,
    "senderName" TEXT,
    "senderUsername" TEXT,
    "text" TEXT NOT NULL DEFAULT '',
    "timestamp" TIMESTAMP(3) NOT NULL,
    "isForwarded" BOOLEAN NOT NULL DEFAULT false,
    "fwdFrom" TEXT,
    "matchedRuleIds" JSONB NOT NULL DEFAULT '[]',
    "needsSummary" BOOLEAN NOT NULL DEFAULT true,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "r2Key" TEXT NOT NULL,
    "r2Url" TEXT NOT NULL,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'global',
    "summaryMarkdown" TEXT NOT NULL,
    "topics" JSONB NOT NULL DEFAULT '[]',
    "stats" JSONB NOT NULL DEFAULT '{}',
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "r2AccountId" TEXT,
    "r2AccessKeyEnc" TEXT,
    "r2SecretKeyEnc" TEXT,
    "r2Bucket" TEXT,
    "r2Endpoint" TEXT,
    "r2PublicUrl" TEXT,
    "aiBaseUrl" TEXT,
    "aiApiKeyEnc" TEXT,
    "aiModel" TEXT DEFAULT 'gpt-4o-mini',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sources_enabled_idx" ON "sources"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "sources_accountId_tgChatId_key" ON "sources"("accountId", "tgChatId");

-- CreateIndex
CREATE INDEX "rules_enabled_idx" ON "rules"("enabled");

-- CreateIndex
CREATE INDEX "rules_sourceId_idx" ON "rules"("sourceId");

-- CreateIndex
CREATE INDEX "messages_sourceId_timestamp_idx" ON "messages"("sourceId", "timestamp");

-- CreateIndex
CREATE INDEX "messages_timestamp_idx" ON "messages"("timestamp");

-- CreateIndex
CREATE INDEX "messages_needsSummary_idx" ON "messages"("needsSummary");

-- CreateIndex
CREATE UNIQUE INDEX "messages_accountId_tgChatId_tgMessageId_key" ON "messages"("accountId", "tgChatId", "tgMessageId");

-- CreateIndex
CREATE INDEX "media_messageId_idx" ON "media"("messageId");

-- CreateIndex
CREATE INDEX "reports_date_idx" ON "reports"("date");

-- CreateIndex
CREATE UNIQUE INDEX "reports_date_scope_key" ON "reports"("date", "scope");

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rules" ADD CONSTRAINT "rules_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
