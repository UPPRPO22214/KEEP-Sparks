// src/app/admin/events/[eventId]/page.tsx
export const runtime = "nodejs";

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteForm } from "@/components/ConfirmDeleteForm";
import { revalidatePath } from "next/dist/server/web/spec-extension/revalidate";

async function addScore(eventId: string, formData: FormData) {
  "use server";

  const me = await getSessionUser();
  if (!me || (me.role !== "ADMIN" && me.role !== "MODERATOR")) redirect("/");

  const userId = String(formData.get("userId") ?? "");
  const delta = Number(formData.get("delta") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim();

  if (!userId || !Number.isFinite(delta) || delta === 0) redirect(`/admin/events/${eventId}`);

  // ensure event exists and is not soft-deleted
  const ev = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null, shift: { deletedAt: null } },
    select: { id: true, shiftId: true },
  });
  if (!ev) redirect("/admin/shifts");

  await prisma.scoreTxn.create({
    data: {
      shiftId: ev.shiftId,
      eventId: ev.id,
      userId,
      createdById: me.userId,
      delta,
      comment: comment ? comment : null,
    },
  });

  redirect(`/admin/events/${eventId}`);
}

async function deleteEvent(eventId: string, _formData: FormData) {
  "use server";

  const me = await getSessionUser();
  if (!me || (me.role !== "ADMIN" && me.role !== "MODERATOR")) redirect("/");

    const ev = await prisma.event.findFirst({
        where: { id: eventId, deletedAt: null },
        select: { shiftId: true },
    });
    if (!ev) redirect("/admin/shifts");

    // Soft delete: keep ScoreTxn, eventId in ScoreTxn will remain,
    // but since we filter deleted events in UI, it will disappear.
    await prisma.event.update({
        where: { id: eventId },
        data: { deletedAt: new Date() },
    });

    revalidatePath(`/admin/shifts/${ev.shiftId}`);
    redirect(`/admin/shifts/${ev.shiftId}`);

}

export default async function AdminEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const me = await getSessionUser();
  if (!me) redirect("/");
  if (me.role !== "ADMIN" && me.role !== "MODERATOR") redirect("/");

  const { eventId } = await params;

  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null, shift: { deletedAt: null } },
    select: {
      id: true,
      title: true,
      details: true,
      shiftId: true,
      shift: {
        select: {
          title: true,
          members: {
            where: { deletedAt: null },
            orderBy: { createdAt: "asc" },
            select: {
              user: { select: { id: true, firstName: true, telegramId: true } },
            },
          },
        },
      },
      scoreTxns: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          delta: true,
          comment: true,
          createdAt: true,
          user: { select: { firstName: true, telegramId: true } },
          createdBy: { select: { firstName: true, telegramId: true } },
          event: {
            // If the event was soft-deleted later, we'd not be on this page.
            // Still, keep for future-proofing.
            select: { title: true, deletedAt: true },
          },
        },
      },
    },
  });

  if (!event) redirect("/admin/shifts");

  return (
    <main className="min-h-dvh p-6 space-y-6">
      <Card className="max-w-2xl">
        <CardHeader className="space-y-2">
          <div>
            <CardTitle>{event.title}</CardTitle>
            <div className="text-sm text-muted-foreground">Смена: {event.shift.title}</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/admin/events/${event.id}/edit`}>Редактировать</Link>
            </Button>

            <ConfirmDeleteForm
              action={deleteEvent.bind(null, event.id)}
              title="Удалить мероприятие?"
              description="Мероприятие исчезнет из смены. Начисления сохранятся и останутся в истории участников."
              buttonText="Удалить мероприятие"
              confirmText="Удалить"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {event.details ? <div className="text-sm whitespace-pre-wrap">{event.details}</div> : null}

          <div className="border rounded-md p-4 space-y-3">
            <div className="font-medium">Начислить баллы</div>

            {event.shift.members.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                В смене пока нет участников. Сначала добавь участников в смену.
              </div>
            ) : (
              <form action={addScore.bind(null, eventId)} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Участник</label>
                  <select
                    name="userId"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Выбрать…</option>
                    {event.shift.members.map((m) => (
                      <option key={m.user.id} value={m.user.id}>
                        {(m.user.firstName ?? "Без имени") +
                          " (" +
                          m.user.telegramId.toString() +
                          ")"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Delta (может быть отрицательной)</label>
                  <input
                    name="delta"
                    type="number"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    placeholder="например 5 или -2"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Комментарий</label>
                  <input
                    name="comment"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    placeholder="за что начислили/сняли"
                  />
                </div>

                <Button type="submit">Записать</Button>
              </form>
            )}
          </div>

          <div className="space-y-2">
            <div className="font-medium">Последние начисления (до 20)</div>
            {event.scoreTxns.length === 0 ? (
              <div className="text-sm text-muted-foreground">Пока пусто.</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {event.scoreTxns.map((t) => (
                  <li key={t.id} className="border rounded-md p-3">
                    <div className="font-medium">
                      {t.user.firstName ?? "Участник"} ({t.user.telegramId.toString()}):{" "}
                      <b>{t.delta > 0 ? `+${t.delta}` : t.delta}</b>
                    </div>
                    {t.comment ? <div className="text-muted-foreground">{t.comment}</div> : null}
                    <div className="text-muted-foreground">
                      {t.createdAt.toLocaleString()} • выставил:{" "}
                      {t.createdBy.firstName ?? "модератор"} ({t.createdBy.telegramId.toString()})
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/admin/shifts/${event.shiftId}`}>← К смене</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/admin/shifts/${event.shiftId}/members`}>Участники</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
