import Link from "next/link";
import { SITE } from "@/lib/site";
import { TokenFeed } from "@/components/TokenFeed";
import { KoreTokenCard } from "@/components/KoreTokenCard";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* ── Hero ── */}
      <section className="relative pt-14 lg:pt-20">
        <div className="animate-fade-up">
          <h1 className="max-w-3xl text-balance font-display text-[2.75rem] font-extrabold leading-[1.02] tracking-tight text-zinc-900 sm:text-7xl">
            Coined your <span className="grad-text">fomo</span> profile
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">
            Turn your fomo.family profile into a tradable token in one signed tap. Kore drafts the
            coin name, ticker, avatar and launch thread, then lists it on the {SITE.poweredBy} bonding
            curve. Non custodial. Creator fees route straight to you.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/create" className="btn-brand px-7 py-4 text-base">Launch my profile →</Link>
            <Link href="/docs" className="btn-glass px-7 py-4 text-base">How it works</Link>
          </div>
        </div>
      </section>

      {/* ── Official $KORE token (live price from Pons) ── */}
      <section className="mt-10">
        <KoreTokenCard />
      </section>

      {/* ── Trending feed ── */}
      <section className="mt-14 pb-4">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-zinc-900">
              Trending on <span className="grad-text">Kore</span>
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Every coin launched on Kore routes its creator fees to that fomo.family profile’s wallet.
            </p>
          </div>
          <Link href="/leaderboard" className="hidden shrink-0 font-mono text-xs uppercase tracking-widest text-pink-soft hover:underline sm:inline">
            View leaderboard →
          </Link>
        </div>
        <TokenFeed limit={48} />
      </section>
    </div>
  );
}
