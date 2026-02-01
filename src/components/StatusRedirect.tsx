"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function StatusRedirect(props: { href: string; seconds: number }) {
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
    <span className="tabular-nums">{remaining}</span>
  );
}
