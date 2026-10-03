-- AlterTable
ALTER TABLE "ItemScore" ADD COLUMN     "promptVersion" INTEGER;

-- CreateTable
CREATE TABLE "PromptRevision" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromptRevision_templateId_createdAt_idx" ON "PromptRevision"("templateId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PromptRevision_templateId_version_key" ON "PromptRevision"("templateId", "version");

-- AddForeignKey
ALTER TABLE "PromptRevision" ADD CONSTRAINT "PromptRevision_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PromptTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;