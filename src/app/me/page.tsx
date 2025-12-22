export const runtime = "nodejs";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TgBackButton } from "@/components/TgBackButton";

export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{ shiftId?: string }>;
}) {
  const me = await getSessionUser();
  if (!me) redirect("/");

  const { shiftId: shiftIdFromQuery } = await searchParams;

  // Все смены, в которых пользователь состоит (самая свежая — первая)
  const memberships = await prisma.shiftMember.findMany({
    where: { 
        userId: me.userId, 
        deletedAt: null, 
        shift: { deletedAt: null } 
    },
    orderBy: { createdAt: "desc" },
    select: { shiftId: true, shift: { select: { title: true } } },
  });

  if (memberships.length === 0) {
    return (
      <main className="min-h-dvh p-6">
        <TgBackButton href="/" />
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Пока нет смен</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Тебя ещё не добавили в смену. Попроси вожатого/модератора добавить твой telegramId.
          </CardContent>
        </Card>
      </main>
    );
  }

  const shiftId =
    shiftIdFromQuery && memberships.some((m) => m.shiftId === shiftIdFromQuery)
      ? shiftIdFromQuery
      : memberships[0].shiftId;

  const activeShiftTitle =
    memberships.find((m) => m.shiftId === shiftId)?.shift.title ?? "Смена";

  // Сумма баллов
  const totalAgg = await prisma.scoreTxn.aggregate({
    where: { shiftId, userId: me.userId },
    _sum: { delta: true },
  });
  const total = totalAgg._sum.delta ?? 0;

  // История (последние 30)
  const history = await prisma.scoreTxn.findMany({
    where: { shiftId, userId: me.userId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      delta: true,
      comment: true,
      createdAt: true,
      event: { select: { title: true } },
    },
  });

  // Рейтинг (топ-20 по смене)
  const leaderboardRows = await prisma.scoreTxn.groupBy({
    by: ["userId"],
    where: { shiftId },
    _sum: { delta: true },
    orderBy: { _sum: { delta: "desc" } },
    take: 20,
  });

  const userIds = leaderboardRows.map((r) => r.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, firstName: true, telegramId: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));
  const leaderboard = leaderboardRows.map((r, idx) => ({
    rank: idx + 1,
    points: r._sum.delta ?? 0,
    user: userMap.get(r.userId),
  }));

  return (
    <main className="min-h-dvh p-6 space-y-6">
      {/* Telegram back button in the header (only visible in Telegram) */}
      <TgBackButton href="/" />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Мои баллы</CardTitle>
          <div className="text-sm text-muted-foreground">Смена: {activeShiftTitle}</div>

          {/* Shift switcher */}
          <div className="flex flex-wrap gap-2 pt-2">
            {memberships.map((m) => (
              <a
                key={m.shiftId}
                href={`/me?shiftId=${m.shiftId}`}
                className={`text-xs border rounded-md px-2 py-1 ${
                  m.shiftId === shiftId ? "font-semibold" : ""
                }`}
              >
                {m.shift.title}
              </a>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-3xl font-semibold">{total}</div>

          <div className="space-y-2">
            <div className="font-medium">История (до 30)</div>
            {history.length === 0 ? (
              <div className="text-sm text-muted-foreground">Пока нет начислений.</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {history.map((t) => (
                  <li key={t.id} className="border rounded-md p-3">
                    <div className="font-medium">
                      {t.event?.title ?? "Без мероприятия"}:{" "}
                      <b>{t.delta > 0 ? `+${t.delta}` : t.delta}</b>
                    </div>
                    {t.comment ? <div className="text-muted-foreground">{t.comment}</div> : null}
                    <div className="text-muted-foreground">{t.createdAt.toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Рейтинг (топ 20)</CardTitle>
          <div className="text-sm text-muted-foreground">Смена: {activeShiftTitle}</div>
        </CardHeader>

        <CardContent className="space-y-2 text-sm">
          {leaderboard.length === 0 ? (
            <div className="text-muted-foreground">Пока нет данных.</div>
          ) : (
            <ol className="space-y-2">
              {leaderboard.map((row) => (
                <li
                  key={row.rank}
                  className={`border rounded-md p-3 flex justify-between ${
                    row.user?.id === me.userId ? "font-semibold" : ""
                  }`}
                >
                  <div>
                    <div>
                      #{row.rank} {row.user?.firstName ?? "Без имени"} (
                      {row.user?.telegramId.toString() ?? "?"})
                    </div>
                  </div>
                  <div>{row.points}</div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Fallback back link (visible everywhere) */}
      <div className="max-w-2xl">
        <a href="/" className="text-sm underline">
          ← На главную
        </a>
      </div>
    </main>
  );
}
