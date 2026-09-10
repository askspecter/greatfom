"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

/**
 * Mobile bottom tab bar — the app-style navigation matching fomo.family's
 * layout: Home, Explore, Dime (center), Leaderboard, Create.
 * Desktop keeps the top SiteHeader, so this is hidden from md up.
 */
type Tab = { href: string; label: string; icon: React.ReactNode };

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const TABS: Tab[] = [
  { href: "/", label: "Home", icon: <Icon d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" /> },
  { href: "/explore", label: "Explore", icon: <Icon d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3" /> },
  // center handled specially
  { href: "/leaderboard", label: "Ranks", icon: <Icon d="M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM22 19v-2a4 4 0 0 0-3-3.87M16 2.13a4 4 0 0 1 0 7.75" /> },
  { href: "/create", label: "Create", icon: <Icon d="M12 5v14M5 12h14" /> },
];

export function BottomNav() {
  const pathname = usePathname();
  const active = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden" aria-label="Primary">
      <div className="mx-auto mb-3 flex max-w-md items-center justify-between gap-1 rounded-full border border-ink-line bg-ink-900/85 px-3 py-2 shadow-card backdrop-blur-xl">
        {TABS.slice(0, 2).map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-label={t.label}
            className={`flex flex-1 flex-col items-center gap-0.5 py-1 transition ${
              active(t.href) ? "text-pink" : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            {t.icon}
          </Link>
        ))}

        {/* Center: elevated Dime logo */}
        <Link href="/" aria-label="Dime home" className="flex flex-1 justify-center">
          <span
            className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl transition ${
              pathname === "/" ? "ring-2 ring-[#a9b8ff]/60" : ""
            }`}
            style={{ boxShadow: "0 10px 30px -12px rgba(130,150,255,0.7)" }}
          >
            <Logo className="h-11 w-11" />
          </span>
        </Link>

        {TABS.slice(2).map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-label={t.label}
            className={`flex flex-1 flex-col items-center gap-0.5 py-1 transition ${
              active(t.href) ? "text-pink" : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            {t.icon}
          </Link>
        ))}
      </div>
    </nav>
  );
}
