-- AlterTable
ALTER TABLE "task" ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "task_parentId_idx" ON "task"("parentId");

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
