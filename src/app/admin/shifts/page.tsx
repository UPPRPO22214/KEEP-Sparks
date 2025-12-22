export const runtime = "nodejs";

import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ShiftsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role !== "ADMIN" && user.role !== "MODERATOR") redirect("/");

  const shifts = await prisma.shift.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, createdAt: true },
  });

  return (
    <main className="min-h-dvh p-6 space-y-6">
      <Card className="max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Смены</CardTitle>
          <Button asChild>
            <Link href="/admin/shifts/new">+ Создать</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {shifts.length === 0 ? (
            <div className="text-muted-foreground">Пока нет ни одной смены.</div>
          ) : (
            <ul className="space-y-2">
              {shifts.map((s) => (
                <li key={s.id} className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <div className="font-medium">{s.title}</div>
                    <div className="text-muted-foreground">
                      {s.createdAt.toLocaleString()}
                    </div>
                  </div>
                  <Button asChild variant="outline">
                    <Link href={`/admin/shifts/${s.id}`}>Открыть</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Button asChild variant="ghost">
        <Link href="/admin">← Назад в админку</Link>
      </Button>
    </main>
  );
}
