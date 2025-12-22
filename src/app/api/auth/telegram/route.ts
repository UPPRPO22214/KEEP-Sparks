export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { verifyTelegramInitData } from "@/lib/telegram";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const { initData } = (await req.json().catch(() => ({}))) as { initData?: string };
  if (!initData) return NextResponse.json({ ok: false, error: "No initData" }, { status: 400 });

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.SESSION_SECRET;
  if (!botToken || !secret) {
    return NextResponse.json({ ok: false, error: "Server misconfigured" }, { status: 500 });
  }

  const verified = verifyTelegramInitData(initData, botToken);
  if (!verified.ok || !verified.user) {
    return NextResponse.json({ ok: false, error: "Invalid initData" }, { status: 401 });
  }

  // 1) Upsert user in DB
  const dbUser = await prisma.user.upsert({
    where: { telegramId: BigInt(verified.user.id) },
    update: { firstName: verified.user.first_name ?? null },
    create: {
      telegramId: BigInt(verified.user.id),
      firstName: verified.user.first_name ?? null,
      role: "USER",
    },
    select: { id: true, role: true, telegramId: true, firstName: true },
  });

  // 2) Sign session JWT
  const jwt = await new SignJWT({
    userId: dbUser.id,
    role: dbUser.role,
    tgId: dbUser.telegramId.toString(),
    firstName: dbUser.firstName ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(secret));

  const res = NextResponse.json({ ok: true, user: { id: dbUser.id, role: dbUser.role } });
  res.cookies.set("session", jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
