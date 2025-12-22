-- CreateTable
CREATE TABLE "ShiftMember" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShiftMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShiftMember_shiftId_idx" ON "ShiftMember"("shiftId");

-- CreateIndex
CREATE INDEX "ShiftMember_userId_idx" ON "ShiftMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftMember_shiftId_userId_key" ON "ShiftMember"("shiftId", "userId");

-- AddForeignKey
ALTER TABLE "ShiftMember" ADD CONSTRAINT "ShiftMember_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftMember" ADD CONSTRAINT "ShiftMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
