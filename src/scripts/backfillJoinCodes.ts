import "dotenv/config";
import { prisma } from "@/lib/db";

function genCode(len = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // без 0/O/1/I
  let s = "";
  for (let i = 0; i < len; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

async function main() {
  const shifts = await prisma.shift.findMany({ select: { id: true, joinCode: true } });

  for (const sh of shifts) {
    if (sh.joinCode) continue;

    // пробуем несколько раз на случай коллизии
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = genCode(6);
      const exists = await prisma.shift.findUnique({ where: { joinCode: code } });
      if (exists) continue;

      await prisma.shift.update({ where: { id: sh.id }, data: { joinCode: code } });
      break;
    }
  }

  console.log("Done");
}

main().finally(() => prisma.$disconnect());
