"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLink(props: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, props.href);

  return (
    <Link
      href={props.href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white dark:bg-white dark:text-black"
          : "rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
      }
    >
      {props.children}
    </Link>
  );
}
