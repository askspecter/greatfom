import Link from "next/link";
import { SITE } from "@/lib/site";
import { TokenFeed } from "@/components/TokenFeed";
import { HeroShowcase } from "@/components/HeroShowcase";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* ── Hero ── */}
      <section className="relative grid items-center gap-10 pt-14 lg:grid-cols-[1.05fr_.95fr] lg:pt-20">
        <div className="animate-fade-up">
          <span className="eyebrow">
            <span className="pulse-dot" /> Profile coins on {SITE.poweredBy} · live
          </span>
          <h1 className="mt-7 max-w-2xl font-display text-5xl font-extrabold leading-[0.96] tracking-tight text-zinc-900 sm:text-7xl">
            Coin your <span className="grad-text">@fomo</span>.<br />Own the upside.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-zinc-600 sm:text-lg">
            Turn your fomo.family profile into a tradable token in one signed tap. Dime drafts the
            coin — name, ticker, avatar, launch thread — and lists it on the {SITE.poweredBy} bonding
            curve. Non-custodial. Creator fees route straight to you.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/create" className="btn-brand px-7 py-4 text-base">Launch my profile →</Link>
            <Link href="/docs" className="btn-glass px-7 py-4 text-base">How it works</Link>
          </div>
          <div className="mt-9 flex items-center gap-4">
            <div className="flex">
              {[
                ["L", "linear-gradient(135deg,#8b7bff,#c9a2ff)"],
                ["K", "linear-gradient(135deg,#38e5cc,#7ee8e0)"],
                ["D", "linear-gradient(135deg,#ff9e7a,#ffd07a)"],
                ["R", "linear-gradient(135deg,#ff5ca8,#ffa8cf)"],
              ].map(([ch, bg], i) => (
                <span
                  key={i}
                  className="-ml-2.5 flex h-9 w-9 items-center justify-center rounded-full font-display text-xs font-bold text-[#08060f] first:ml-0"
                  style={{ background: bg as string, border: "2px solid #0a0a12" }}
                >
                  {ch}
                </span>
              ))}
            </div>
            <p className="text-sm text-zinc-500">
              <span className="font-semibold text-zinc-900">1,240 creators</span> already coined their profile
            </p>
          </div>
        </div>

        <div className="animate-fade-up lg:justify-self-end">
          <HeroShowcase />
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="mt-16 grid grid-cols-2 divide-x divide-y divide-ink-line border-y border-ink-line sm:grid-cols-4 sm:divide-y-0">
        {[
          ["1,240+", "Profiles coined"],
          ["$4.8M", "Curve volume"],
          ["$312K", "Creator fees paid"],
          ["0%", "Custody · you sign"],
        ].map(([b, s], i) => (
          <div key={i} className="px-3 py-8 text-center">
            <div className="ink-sheen font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{b}</div>
            <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">{s}</div>
          </div>
        ))}
      </section>

      {/* ── Trending feed ── */}
      <section className="mt-16 pb-4">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-zinc-900">
              Trending on <span className="grad-text">Dime</span>
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Every coin launched on Dime — its creator fees route to that fomo.family profile’s wallet.
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
        {SITE.name} is a third-party interface to {SITE.poweredBy} · Non-custodial · Not financial advice
      </p>
    </div>
  );
}
