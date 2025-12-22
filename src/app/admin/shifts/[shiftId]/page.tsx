// src/app/admin/shifts/[shiftId]/page.tsx
export const runtime = "nodejs";

import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteForm } from "@/components/ConfirmDeleteForm";

async function deleteShift(shiftId: string, _formData: FormData) {
  "use server";

  const me = await getSessionUser();
  if (!me || (me.role !== "ADMIN" && me.role !== "MODERATOR")) redirect("/");

  await prisma.$transaction([
    prisma.shift.update({ where: { id: shiftId }, data: { deletedAt: new Date() } }),
    prisma.event.updateMany({ where: { shiftId }, data: { deletedAt: new Date() } }),
    prisma.shiftMember.updateMany({ where: { shiftId }, data: { deletedAt: new Date() } }),
  ]);

  revalidatePath("/admin/shifts");
  revalidatePath(`/admin/shifts/${shiftId}`);

  redirect("/admin/shifts");
}

export default async function ShiftPage({
  params,
}: {
  params: Promise<{ shiftId: string }>;
}) {
  const me = await getSessionUser();
  if (!me) redirect("/");
  if (me.role !== "ADMIN" && me.role !== "MODERATOR") redirect("/");

  const { shiftId } = await params;

  const shift = await prisma.shift.findFirst({
    where: { id: shiftId, deletedAt: null },
    select: {
      id: true,
      title: true,
      joinCode: true,
      createdAt: true,
      events: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, createdAt: true },
      }
    },
  });

  if (!shift) {
    return (
      <main className="min-h-dvh p-6">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Смена не найдена</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="text-muted-foreground">
              Возможно, смена удалена (soft delete) или не существует.
            </div>
            <Button asChild variant="outline">
              <Link href="/admin/shifts">← К списку смен</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const [membersCount, eventsCount] = await prisma.$transaction([
    prisma.shiftMember.count({ where: { shiftId: shift.id, deletedAt: null } }),
    prisma.event.count({ where: { shiftId: shift.id, deletedAt: null } }),
  ]);

  return (
    <main className="min-h-dvh p-6 space-y-6">
      <Card className="max-w-3xl">
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-1">
            <CardTitle>{shift.title}</CardTitle>
            <div className="text-sm text-muted-foreground">
              Код вступления: <b>{shift.joinCode}</b>
            </div>
            <div className="text-xs text-muted-foreground">
              Создано: {shift.createdAt.toLocaleString()} • Участников: {membersCount} •
              Мероприятий: {eventsCount}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/admin/shifts/${shift.id}/events/new`}>+ Мероприятие</Link>
            </Button>

            <Button asChild variant="outline">
              <Link href={`/admin/shifts/${shift.id}/members`}>Участники</Link>
            </Button>

            <Button asChild variant="outline">
              <Link href={`/admin/shifts/${shift.id}/edit`}>Редактировать</Link>
            </Button>

            <ConfirmDeleteForm
              action={deleteShift.bind(null, shift.id)}
              title="Удалить смену?"
              description="Смена, её мероприятия и участники будут скрыты. Это soft delete: данные остаются в базе."
              buttonText="Удалить смену"
              confirmText="Удалить"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="font-medium">Мероприятия</div>

            {shift.events.length === 0 ? (
              <div className="text-sm text-muted-foreground">Мероприятий пока нет.</div>
            ) : (
              <ul className="space-y-2">
                {shift.events.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-3 border rounded-md p-3"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{e.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {e.createdAt.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button asChild variant="outline">
                        <Link href={`/admin/events/${e.id}`}>Открыть</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href={`/admin/events/${e.id}/edit`}>Редактировать</Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

       <Button asChild variant="ghost" className="ml-auto">
          <Link href="/admin/shifts">← К списку смен</Link>
        </Button>
    </main>
  );
}
