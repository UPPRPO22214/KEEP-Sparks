import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { Button } from "@/components/ui/button";

export async function AppNav() {
  const user = await getSessionUser();
  const isAdmin = user?.role === "ADMIN" || user?.role === "MODERATOR";

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-2xl p-3 flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">Главная</Link>
        </Button>

        <Button asChild variant="ghost" size="sm">
          <Link href="/me">Мои баллы</Link>
        </Button>

        {isAdmin ? (
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin">Админка</Link>
          </Button>
        ) : null}

        <div className="ml-auto text-xs text-muted-foreground">
          {user ? `role: ${user.role}` : "не залогинен"}
        </div>
      </div>
    </header>
  );
}
