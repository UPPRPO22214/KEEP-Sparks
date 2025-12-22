export const runtime = "nodejs";

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TelegramDebug } from "@/components/TelegramDebug";

async function joinShift(formData: FormData) {
  "use server";

  const me = await getSessionUser();
  if (!me) redirect("/");

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!code) redirect("/");

  const shift = await prisma.shift.findFirst({
    where: { joinCode: code, deletedAt: null },
    select: { id: true },
  });


  if (!shift) {
    // MVP: просто вернём на главную (можно позже сделать красивую ошибку)
    redirect("/?err=badcode");
  }

  await prisma.shiftMember.upsert({
    where: { shiftId_userId: { shiftId: shift.id, userId: me.userId } },
    update: { deletedAt: null },
    create: { shiftId: shift.id, userId: me.userId },
  });

  redirect(`/me?shiftId=${shift.id}`);
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const user = await getSessionUser();
  const { err } = await searchParams;

  const canAdmin = user?.role === "ADMIN" || user?.role === "MODERATOR";

  return (
    <main className="min-h-dvh p-6 space-y-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Camp Points</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="text-muted-foreground">
            Приложение для учёта баллов в смене/лагере: участники смотрят баллы и рейтинг, модераторы начисляют баллы за мероприятия.
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/me">Мои баллы</Link>
            </Button>

            {canAdmin ? (
              <Button asChild>
                <Link href="/admin">Админка</Link>
              </Button>
            ) : null}
          </div>

          <div className="border rounded-md p-4 space-y-3">
            <div className="font-medium">Вступить в смену по коду</div>

            {err === "badcode" ? (
              <div className="text-sm text-red-600">Код не найден. Проверь и попробуй ещё раз.</div>
            ) : null}

            <form action={joinShift} className="flex gap-2">
              <input
                name="code"
                className="flex-1 border rounded-md px-3 py-2 text-sm uppercase"
                placeholder="например A7K3Q9"
                required
              />
              <Button type="submit" disabled={!user}>
                Вступить
              </Button>
            </form>

            {!user ? (
              <div className="text-xs text-muted-foreground">
                Сначала нажми “Войти” (в Telegram Mini App), чтобы создать сессию.
              </div>
            ) : null}
          </div>

          <div className="text-xs text-muted-foreground">
            Твой статус: {user ? `role=${user.role}` : "не залогинен"}
          </div>
        </CardContent>
      </Card>

      <TelegramDebug />
    </main>
  );
}
