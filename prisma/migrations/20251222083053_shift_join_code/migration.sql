/*
  Warnings:

  - A unique constraint covering the columns `[joinCode]` on the table `Shift` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Shift" ADD COLUMN     "joinCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Shift_joinCode_key" ON "Shift"("joinCode");
