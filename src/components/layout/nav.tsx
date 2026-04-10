"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getContributorCookies } from "@/lib/cookies";

export function Nav() {
  const pathname = usePathname();
  const [hasIdentity, setHasIdentity] = useState(false);

  useEffect(() => {
    const { email } = getContributorCookies();
    setHasIdentity(!!email);
  }, [pathname]);

  const navItems = [
    { href: "/", label: "Feed" },
    { href: "/submit", label: "Submit" },
    ...(hasIdentity ? [{ href: "/my-submissions", label: "My Submissions" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
        <Link href="/" className="mr-8 flex items-center gap-2">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-foreground"
          >
            <path
              d="M2 12h3l2 -3 2 4 2 -8 2 10 2 -6 2 3h5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-lg font-bold tracking-tight">
            The Signal
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 -mx-1",
                pathname === item.href
                  ? "text-foreground"
                  : "text-foreground/60"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
