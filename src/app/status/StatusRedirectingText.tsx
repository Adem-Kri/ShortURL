"use client";

import { useMemo } from "react";
import { StatusRedirect } from "@/components/StatusRedirect";

export function StatusRedirectingText(props: {
  seconds: number;
  href: string;
  text: string;
}) {
  const secondsString = useMemo(() => String(props.seconds), [props.seconds]);

  return (
    <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
      {props.text.replace("{seconds}", secondsString)} (
      <StatusRedirect href={props.href} seconds={props.seconds} />)
    </p>
  );
}
