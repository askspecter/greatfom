import Link from "next/link";
import { Logo } from "./Logo";
import { SITE } from "@/lib/site";

const PRODUCT = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/create", label: "Launch" },
  { href: "/profile", label: "My Profile" },
  { href: "/docs", label: "Docs" },
] as const;

const LEGAL = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();
  const links = [...PRODUCT, ...LEGAL];

  return (
    <footer className="mt-16 px-4 pb-8">
      <div className="mx-auto max-w-6xl card p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <Logo className="h-7 w-7" />
          <span className="wordmark text-xl text-zinc-900">{SITE.name}</span>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-500">
          Tokenize your fomo.family profile and launch it on the {SITE.poweredBy} bonding curve on{" "}
          {SITE.chain}. Your wallet submits every transaction. {SITE.name} does not custody assets.
        </p>

        <nav className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-zinc-600 transition hover:text-zinc-900">
              {l.label}
            </Link>
          ))}
        </nav>

        <p className="mt-5 max-w-3xl text-xs leading-relaxed text-zinc-400">
          {SITE.name} is a non-custodial, third-party interface to the {SITE.poweredBy} protocol.
          Transactions may be irreversible and tokens can lose all value. {SITE.name} provides no
          custody, warranties, or financial advice, and is not an official {SITE.poweredBy} or
          fomo.family product. Nothing here is an endorsement of any profile or token.
        </p>

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-ink-line pt-5">
          <p className="text-xs text-zinc-500">© {year} {SITE.company}</p>
          <a
            href={SITE.x}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-zinc-600 underline-offset-4 transition hover:text-zinc-900 hover:underline"
          >
            {SITE.xHandle}
          </a>
        </div>
      </div>
    </footer>
  );
}
