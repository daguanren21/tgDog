/*
  Warnings:

  - You are about to drop the column `sourceId` on the `rules` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ScopeMode" AS ENUM ('ALL', 'SELECTED');

-- DropForeignKey
ALTER TABLE "rules" DROP CONSTRAINT "rules_sourceId_fkey";

-- DropIndex
DROP INDEX "rules_sourceId_idx";

-- AlterTable
ALTER TABLE "rules" DROP COLUMN "sourceId",
ADD COLUMN     "scopeMode" "ScopeMode" NOT NULL DEFAULT 'ALL';

-- CreateTable
CREATE TABLE "_RuleSources" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RuleSources_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_RuleSources_B_index" ON "_RuleSources"("B");

-- AddForeignKey
ALTER TABLE "_RuleSources" ADD CONSTRAINT "_RuleSources_A_fkey" FOREIGN KEY ("A") REFERENCES "rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RuleSources" ADD CONSTRAINT "_RuleSources_B_fkey" FOREIGN KEY ("B") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
