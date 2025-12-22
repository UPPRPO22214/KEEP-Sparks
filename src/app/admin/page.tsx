export const runtime = "nodejs";

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";


export default async function AdminPage() {
  const user = await getSessionUser();

  if (!user) redirect("/"); // не залогинен — домой

  const allowed = user.role === "ADMIN" || user.role === "MODERATOR";
  if (!allowed) {
    return (
      <main className="min-h-dvh p-6">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Доступ запрещён</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            Ваша роль: <b>{user.role}</b>. Нужна роль MODERATOR или ADMIN.
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-dvh p-6">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Админ-панель</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div>Вы вошли как: <b>{user.role}</b></div>
          <div>UserId: <code>{user.userId}</code></div>
            <Button asChild>
                <Link href="/admin/shifts">Смены</Link>
            </Button>
        </CardContent>
        </Card>
    </main>
  );
}
