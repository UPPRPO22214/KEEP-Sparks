"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function TgBackButton({ href = "/" }: { href?: string }) {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const mod = await import("@twa-dev/sdk");
      const WebApp = (mod.default ?? mod) as any;

      if (!isMounted) return;

      // Показываем кнопку "назад" в Telegram
      WebApp?.BackButton?.show();

      const onClick = () => router.push(href);
      WebApp?.BackButton?.onClick(onClick);

      return () => {
        WebApp?.BackButton?.offClick(onClick);
        WebApp?.BackButton?.hide();
      };
    })();

    return () => {
      isMounted = false;
    };
  }, [href, router]);

  return null;
}
