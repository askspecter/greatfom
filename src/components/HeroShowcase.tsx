"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SITE } from "@/lib/site";

interface LaunchItem {
  token: string;
  name: string;
  symbol: string;
  logo: string;
  handle?: string;
  createdAt: number;
}
interface McInfo {
  eth: number;
  usd: number | null;
}

function fmtMc(m?: McInfo): string {
  if (!m) return "—";
  if (m.usd != null && m.usd > 0) {
    const n = m.usd;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
    return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
  const e = m.eth;
  if (e >= 1) return `${e.toFixed(2)} ETH`;
  return `${e.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")} ETH`;
}

/**
 * The floating 3D showcase card in the hero. Displays the current top profile
 * coin on Dime (ranked by market cap) with real, non-fabricated facts — market
 * cap, ticker, network. The chart line is an ambient decoration, not price data.
 */
export function HeroShowcase() {
  const [items, setItems] = useState<LaunchItem[] | null>(null);
  const [mcaps, setMcaps] = useState<Record<string, McInfo>>({});

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/launches?limit=20`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => !cancelled && setItems(d.items ?? []))
      .catch(() => !cancelled && setItems([]));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!items || items.length === 0) return;
    let cancelled = false;
    const tokens = items.map((i) => i.token).join(",");
    fetch(`/api/v2/prices?tokens=${tokens}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.prices) return;
        const next: Record<string, McInfo> = {};
        for (const [k, v] of Object.entries(
          d.prices as Record<string, { marketCapEth: number; marketCapUsd: number | null }>,
        )) {
          if (v && typeof v.marketCapEth === "number") next[k] = { eth: v.marketCapEth, usd: v.marketCapUsd ?? null };
        }
        setMcaps(next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [items]);

  const top = useMemo(() => {
    if (!items || items.length === 0) return null;
    return [...items].sort((a, b) => {
      const ma = mcaps[a.token.toLowerCase()]?.eth ?? -1;
      const mb = mcaps[b.token.toLowerCase()]?.eth ?? -1;
      if (ma !== mb) return mb - ma;
      return (b.createdAt || 0) - (a.createdAt || 0);
    })[0];
  }, [items, mcaps]);

  const mc = top ? mcaps[top.token.toLowerCase()] : undefined;
  const initial = (top?.name || top?.symbol || "◈").slice(0, 1).toUpperCase();

  return (
    <div className="relative mx-auto h-[420px] w-full max-w-[520px] sm:h-[480px] [perspective:1600px]">
      {/* halo behind the card */}
      <div
        className="pointer-events-none absolute -left-8 top-6 h-[380px] w-[380px] rounded-full opacity-70 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(123,92,255,0.45), transparent 62%)" }}
        aria-hidden
      />

      {/* the card */}
      <div className="card transform-gpu p-6 shadow-card transition duration-500 md:[transform:perspective(1600px)_rotateY(-14deg)_rotateX(7deg)_rotate(-1deg)] md:hover:[transform:perspective(1600px)_rotateY(-8deg)_rotateX(4deg)]">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-lg font-extrabold text-zinc-900">
            {top?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={top.logo} alt={top.symbol || "coin"} className="h-full w-full object-cover" />
            ) : (
              <span className="grad-text font-display">{initial}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-xl font-bold text-zinc-900">
              {top?.name || "Your profile coin"}
            </div>
            <div className="truncate font-mono text-xs text-zinc-500">
              {top?.handle ? `@${top.handle.replace(/^@+/, "")}` : "@yourhandle"} · fomo.family
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest text-up">
            <span className="pulse-dot" /> Live
          </div>
        </div>

        <div className="mt-6 flex items-end gap-3">
          <div className="font-display text-4xl font-extrabold tracking-tight text-zinc-900">{fmtMc(mc)}</div>
          <div className="mb-1.5 font-mono text-[11px] uppercase tracking-widest text-zinc-500">market cap</div>
        </div>

        {/* ambient aurora line (decorative) */}
        <div className="-mx-1 mt-4">
          <svg width="100%" height="96" viewBox="0 0 500 96" preserveAspectRatio="none" fill="none">
            <path
              d="M0 78 L56 70 L112 75 L168 52 L224 60 L280 38 L336 46 L392 24 L448 32 L500 8"
              stroke="url(#hs)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M0 78 L56 70 L112 75 L168 52 L224 60 L280 38 L336 46 L392 24 L448 32 L500 8 L500 96 L0 96 Z"
              fill="url(#hf)"
              opacity="0.28"
            />
            <defs>
              <linearGradient id="hs" x1="0" y1="0" x2="500" y2="0">
                <stop stopColor="#38e5cc" />
                <stop offset="1" stopColor="#7b5cff" />
              </linearGradient>
              <linearGradient id="hf" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#38e5cc" />
                <stop offset="1" stopColor="#38e5cc" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-ink-line bg-white/[0.03] p-3.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Ticker</div>
            <div className="mt-1 truncate font-display text-base font-bold text-zinc-900">
              ${(top?.symbol || "FOMO").toUpperCase()}
            </div>
          </div>
          <div className="rounded-2xl border border-ink-line bg-white/[0.03] p-3.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Network</div>
            <div className="mt-1 truncate font-display text-base font-bold text-zinc-900">Robinhood</div>
          </div>
          <div className="rounded-2xl border border-ink-line bg-white/[0.03] p-3.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Curve</div>
            <div className="mt-1 truncate font-display text-base font-bold text-zinc-900">{SITE.poweredBy}</div>
          </div>
        </div>
      </div>

      {/* floating chips */}
      <div className="absolute right-0 top-0 z-10 hidden items-center gap-3 rounded-2xl border border-white/[0.14] bg-ink-900/70 p-3.5 shadow-float backdrop-blur-xl sm:flex">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-up/15">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ef0a3" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 17l6-6 4 4 8-8" /><path d="M17 7h4v4" />
          </svg>
        </span>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Live</div>
          <div className="font-display text-sm font-bold text-zinc-900">Bonding curve</div>
        </div>
      </div>

      <div className="absolute bottom-2 left-0 z-10 hidden items-center gap-3 rounded-2xl border border-white/[0.14] bg-ink-900/70 p-3.5 shadow-float backdrop-blur-xl sm:flex">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink/20">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a99bff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13l0-8z" />
          </svg>
        </span>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Non-custodial</div>
          <div className="font-display text-sm font-bold text-zinc-900">You sign</div>
        </div>
      </div>

      {/* whole card links to the top coin when there is one */}
      {top && <Link href={`/launch/${top.token}`} className="absolute inset-0 z-20" aria-label={`View ${top.name}`} />}
    </div>
  );
}
