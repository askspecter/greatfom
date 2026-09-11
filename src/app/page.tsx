import Link from "next/link";
import { SITE } from "@/lib/site";
import { TokenFeed } from "@/components/TokenFeed";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* ── Hero ── */}
      <section className="relative pt-14 lg:pt-20">
        <div className="animate-fade-up">
          <span className="eyebrow">
            <span className="pulse-dot" /> Profile coins on {SITE.poweredBy} · live
          </span>
          <h1 className="mt-7 max-w-3xl text-balance font-display text-[2.75rem] font-extrabold leading-[1.02] tracking-tight text-zinc-900 sm:text-7xl">
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

      {/* ── CTA band ── */}
      <section className="mt-20">
        <div
          className="relative overflow-hidden rounded-3xl border border-white/[0.14] px-8 py-16 text-center sm:px-12 sm:py-20"
          style={{
            background:
              "linear-gradient(120deg, rgba(56,229,204,0.16), rgba(123,92,255,0.22) 55%, rgba(255,92,168,0.16))",
          }}
        >
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-5xl">
            Your profile is worth something.<br />Coin it.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-zinc-600 sm:text-lg">
            Connect your wallet, drop your fomo.family handle, and launch in under a minute. You keep
            the keys and the creator fees.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/create" className="btn-brand px-7 py-4 text-base">Launch my profile →</Link>
            <Link href="/docs" className="btn-glass px-7 py-4 text-base">Read the docs</Link>
          </div>
        </div>
      </section>

      <p className="mb-8 mt-10 text-center font-mono text-[11px] uppercase tracking-wider text-zinc-500">
        {SITE.name} is a third party interface to {SITE.poweredBy} · Non custodial · Not financial advice
      </p>
    </div>
  );
}
