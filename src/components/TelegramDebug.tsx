"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


type TwaWebApp = {
  initData?: string;
  initDataUnsafe?: { user?: { id: number; first_name?: string } };
  platform?: string;
  version?: string;
  ready: () => void;
  expand: () => void;
};

export function TelegramDebug() {
  const [WebApp, setWebApp] = useState<TwaWebApp | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const mod = await import("@twa-dev/sdk");
      const wa = (mod.default ?? mod) as TwaWebApp;
      if (!mounted) return;

      wa.ready?.();
      wa.expand?.();
      setWebApp(wa);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const isTelegram = !!WebApp?.initData;
  const user = WebApp?.initDataUnsafe?.user;

  async function login() {
    const initData = WebApp?.initData;
    if (!initData) {
        alert("Нет initData (открой в Telegram)");
        return;
    }

    const r = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initData }),
    });

    const j = await r.json();
        alert(JSON.stringify(j));
    }


    async function me() {
        const r = await fetch("/api/me");
        const j = await r.json();
        alert(JSON.stringify(j));
    }


    return (
        <Card className="max-w-xl">
        <CardHeader>
            <CardTitle>Telegram Mini App: Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
            <div><b>loaded:</b> {String(!!WebApp)}</div>
            <div><b>isTelegram:</b> {String(isTelegram)}</div>
            <Button onClick={login} disabled={!WebApp}>
                Войти (set cookie)
            </Button>
            <Button onClick={me} variant="outline" disabled={!WebApp}>
                Проверить сессию (/api/me)
            </Button>

            <div><b>platform:</b> {WebApp?.platform ?? "unknown"}</div>
            <div><b>version:</b> {WebApp?.version ?? "unknown"}</div>
            <div><b>user:</b> {user ? `${user.first_name ?? "User"} (${user.id})` : "no user"}</div>
            <div className="break-all">
            <b>initData length:</b> {WebApp?.initData?.length ?? 0}
            </div>
        </CardContent>
        </Card>
  );
}

