/*
  Warnings:

  - Made the column `joinCode` on table `Shift` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Shift" ALTER COLUMN "joinCode" SET NOT NULL;
