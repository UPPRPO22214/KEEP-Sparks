export const runtime = "nodejs";

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

async function updateShift(shiftId: string, formData: FormData) {
  "use server";

  const me = await getSessionUser();
  if (!me || (me.role !== "ADMIN" && me.role !== "MODERATOR")) redirect("/");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) redirect(`/admin/shifts/${shiftId}/edit`);

  await prisma.shift.update({
    where: { id: shiftId },
    data: { title },
  });

  redirect(`/admin/shifts/${shiftId}`);
}

export default async function EditShiftPage({
  params,
}: {
  params: Promise<{ shiftId: string }>;
}) {
  const me = await getSessionUser();
  if (!me) redirect("/");
  if (me.role !== "ADMIN" && me.role !== "MODERATOR") redirect("/");

  const { shiftId } = await params;

  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    select: { id: true, title: true, joinCode: true },
  });

  if (!shift) redirect("/admin/shifts");

  return (
    <main className="min-h-dvh p-6 space-y-6">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Редактировать смену</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Код вступления: <b>{shift.joinCode}</b>
          </div>

          <form action={updateShift.bind(null, shift.id)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="title">
                Название
              </label>
              <input
                id="title"
                name="title"
                defaultValue={shift.title}
                className="w-full border rounded-md px-3 py-2 text-sm"
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">Сохранить</Button>
              <Button asChild variant="outline">
                <Link href={`/admin/shifts/${shift.id}`}>Отмена</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/admin/shifts">← К списку смен</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
