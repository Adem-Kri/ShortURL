"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/app/providers";

export function StatusAutoRedirect(props: { href: string; seconds: number }) {
  const t = useT();
  const router = useRouter();
  const [remaining, setRemaining] = useState(props.seconds);

  useEffect(() => {
    setRemaining(props.seconds);

    const interval = window.setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    const timeout = window.setTimeout(() => {
      router.push(props.href);
    }, props.seconds * 1000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [props.href, props.seconds, router]);

  return (
    <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
      {t("status.redirectingIn", { seconds: String(remaining) })}
    </p>
  );
}
