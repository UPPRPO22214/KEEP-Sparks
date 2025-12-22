export const runtime = "nodejs";

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

async function createEvent(shiftId: string, formData: FormData) {
  "use server";

  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) redirect("/");

  const title = String(formData.get("title") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();

  if (!title) redirect(`/admin/shifts/${shiftId}/events/new`);

  await prisma.event.create({
    data: {
      shiftId,
      title,
      details: details ? details : null,
    },
  });

  redirect(`/admin/shifts/${shiftId}`);
}

export default async function NewEventPage({
  params,
}: {
  params: Promise<{ shiftId: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role !== "ADMIN" && user.role !== "MODERATOR") redirect("/");

  const { shiftId } = await params;

  return (
    <main className="min-h-dvh p-6 space-y-6">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Создать мероприятие</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createEvent.bind(null, shiftId)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="title">
                Название
              </label>
              <input
                id="title"
                name="title"
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder='например: "Эстафета"'
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="details">
                Описание (опционально)
              </label>
              <textarea
                id="details"
                name="details"
                className="w-full border rounded-md px-3 py-2 text-sm min-h-24"
                placeholder="Короткое описание мероприятия"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">Создать</Button>
              <Button asChild variant="outline">
                <Link href={`/admin/shifts/${shiftId}`}>Отмена</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
