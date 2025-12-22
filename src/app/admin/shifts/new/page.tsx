// src/app/admin/shifts/new/page.tsx
export const runtime = "nodejs";

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { genJoinCode } from "@/lib/joinCode";

async function createShift(formData: FormData) {
  "use server";

  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    redirect("/");
  }

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    redirect("/admin/shifts/new");
  }

  // Generate unique joinCode (retry on collisions)
  for (let attempt = 0; attempt < 10; attempt++) {
    const joinCode = genJoinCode(6);

    try {
      await prisma.shift.create({
        data: {
          title,
          joinCode,
        },
      });
      redirect("/admin/shifts");
    } catch (e: any) {
      // P2002: Unique constraint failed (joinCode collision) — retry
      if (e?.code === "P2002") continue;
      throw e;
    }
  }

  // If all retries failed (extremely unlikely), just reload the form
  redirect("/admin/shifts/new");
}

export default async function NewShiftPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role !== "ADMIN" && user.role !== "MODERATOR") redirect("/");

  return (
    <main className="min-h-dvh p-6 space-y-6">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Создать смену</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createShift} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="title">
                Название смены
              </label>
              <input
                id="title"
                name="title"
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder='например: "Летняя смена 2026"'
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">Создать</Button>
              <Button asChild variant="outline">
                <Link href="/admin/shifts">Отмена</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
