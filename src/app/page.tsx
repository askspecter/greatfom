import Link from "next/link";
import { SITE } from "@/lib/site";
import { TokenFeed } from "@/components/TokenFeed";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* ── Compact hero ── */}
      <section className="relative pt-10 sm:pt-14">
        <div className="animate-fade-up">
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-pink" /> Profile coins on {SITE.poweredBy}
          </span>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-black leading-[1.05] tracking-tight text-zinc-900 sm:text-5xl">
            Tokenize your <span className="grad-text">fomo.family</span> profile.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-600 sm:text-base">
            Every coin below launched on Dime, and its creator fees route to that fomo.family
            profile’s wallet. Non-custodial on {SITE.chain}.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/create" className="btn-brand">Launch my profile →</Link>
            <Link href="/explore" className="btn-ghost">Search by contract</Link>
          </div>
        </div>
      </section>

      {/* ── Feed of Dime launches ── */}
      <section className="mt-10 pb-6">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-xl font-black tracking-tight text-zinc-900">
            Latest on <span className="grad-text">Dime</span>
          </h2>
          <Link href="/leaderboard" className="text-xs font-semibold text-pink hover:underline">
            Leaderboard →
          </Link>
        </div>
        <TokenFeed limit={48} />
      </section>

      <p className="mb-8 text-center text-[11px] text-zinc-400">
        {SITE.name} is a third-party interface to the {SITE.poweredBy} protocol, not an official{" "}
        {SITE.poweredBy} or fomo.family product. Not financial advice.
      </p>
    </div>
  );
}
