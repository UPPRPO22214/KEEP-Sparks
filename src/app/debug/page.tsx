export const runtime = "nodejs";

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { TelegramDebug } from "@/components/TelegramDebug";

export default async function DebugPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role !== "ADMIN") redirect("/");

  return (
    <main className="min-h-dvh p-6">
      <TelegramDebug />
    </main>
  );
}
