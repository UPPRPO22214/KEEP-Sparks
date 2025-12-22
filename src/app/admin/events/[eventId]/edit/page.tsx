export const runtime = "nodejs";

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

async function updateEvent(eventId: string, formData: FormData) {
  "use server";

  const me = await getSessionUser();
  if (!me || (me.role !== "ADMIN" && me.role !== "MODERATOR")) redirect("/");

  const title = String(formData.get("title") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();

  if (!title) redirect(`/admin/events/${eventId}/edit`);

  const ev = await prisma.event.update({
    where: { id: eventId },
    data: { title, details: details ? details : null },
    select: { id: true },
  });

  redirect(`/admin/events/${ev.id}`);
}

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const me = await getSessionUser();
  if (!me) redirect("/");
  if (me.role !== "ADMIN" && me.role !== "MODERATOR") redirect("/");

  const { eventId } = await params;

  const ev = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, title: true, details: true, shiftId: true },
  });

  if (!ev) redirect("/admin/shifts");

  return (
    <main className="min-h-dvh p-6 space-y-6">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Редактировать мероприятие</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateEvent.bind(null, ev.id)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="title">
                Название
              </label>
              <input
                id="title"
                name="title"
                defaultValue={ev.title}
                className="w-full border rounded-md px-3 py-2 text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="details">
                Описание
              </label>
              <textarea
                id="details"
                name="details"
                defaultValue={ev.details ?? ""}
                className="w-full border rounded-md px-3 py-2 text-sm min-h-28"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">Сохранить</Button>
              <Button asChild variant="outline">
                <Link href={`/admin/events/${ev.id}`}>Отмена</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href={`/admin/shifts/${ev.shiftId}`}>← К смене</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
