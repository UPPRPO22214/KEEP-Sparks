export const runtime = "nodejs";

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteForm } from "@/components/ConfirmDeleteForm";
import { revalidatePath } from "next/cache";

async function addMember(shiftId: string, formData: FormData) {
  "use server";

  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) redirect("/");

  const tgIdRaw = String(formData.get("telegramId") ?? "").trim();
  if (!tgIdRaw) redirect(`/admin/shifts/${shiftId}/members`);

  let tgId: bigint;
  try {
    tgId = BigInt(tgIdRaw);
  } catch {
    redirect(`/admin/shifts/${shiftId}/members`);
  }

  const memberUser = await prisma.user.upsert({
    where: { telegramId: tgId },
    update: {},
    create: { telegramId: tgId, role: "USER" },
    select: { id: true },
  });

  await prisma.shiftMember.upsert({
    where: { shiftId_userId: { shiftId, userId: memberUser.id } },
    update: { deletedAt: null },
    create: { shiftId, userId: memberUser.id },
  });


  redirect(`/admin/shifts/${shiftId}/members`);
}

async function removeMember(shiftId: string, formData: FormData) {
  "use server";

  const me = await getSessionUser();
  if (!me || (me.role !== "ADMIN" && me.role !== "MODERATOR")) redirect("/");

  const memberId = String(formData.get("memberId") ?? "");
  if (!memberId) redirect(`/admin/shifts/${shiftId}/members`);

  await prisma.shiftMember.update({
    where: { id: memberId },
    data: { deletedAt: new Date() },
  });

  revalidatePath(`/admin/shifts/${shiftId}`);
  revalidatePath(`/admin/shifts/${shiftId}/members`);
  redirect(`/admin/shifts/${shiftId}/members`);

}


export default async function ShiftMembersPage({
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
      members: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          user: { select: { id: true, telegramId: true, firstName: true, role: true } },
        },
      },
    },
  });

  if (!shift) redirect("/admin/shifts");

  return (
    <main className="min-h-dvh p-6 space-y-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Участники смены: {shift.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={addMember.bind(null, shiftId)} className="flex gap-2">
            <input
              name="telegramId"
              className="flex-1 border rounded-md px-3 py-2 text-sm"
              placeholder="telegramId участника (например 252311140)"
              required
            />
            <Button type="submit">Добавить</Button>
          </form>

          {shift.members.length === 0 ? (
            <div className="text-sm text-muted-foreground">Пока нет участников.</div>
          ) : (
            <ul className="space-y-2">
              {shift.members.map((m) => (
                <li key={m.id} className="border rounded-md p-3 text-sm flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      {m.user.firstName ?? "Без имени"} ({m.user.telegramId.toString()})
                    </div>
                    <div className="text-muted-foreground">role: {m.user.role}</div>
                  </div>

                  <ConfirmDeleteForm
                    action={removeMember.bind(null, shiftId)}
                    hidden={{ memberId: m.id }}
                    title="Удалить участника из смены?"
                    description="Участник исчезнет из списка смены. Начисленные баллы в истории останутся."
                    buttonText="Удалить"
                  />

                </li>

              ))}
            </ul>
          )}

          <Button asChild variant="outline">
            <Link href={`/admin/shifts/${shiftId}`}>← Назад к смене</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
