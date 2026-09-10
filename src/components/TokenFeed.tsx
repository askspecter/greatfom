"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

/** A profile coin launched through Dime (from /api/launches). */
interface LaunchItem {
  token: string;
  name: string;
  symbol: string;
  logo: string;
  handle?: string;
  deployer: string;
  createdAt: number;
}

interface McInfo {
  eth: number;
  usd: number | null;
}

function short(a: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

function ago(ts: number): string {
  if (!ts) return "";
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtMc(m: McInfo): string {
  if (m.usd != null && m.usd > 0) {
    const n = m.usd;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
    return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
  const e = m.eth;
  if (e >= 1000) return `${(e / 1000).toFixed(1)}K ETH`;
  if (e >= 1) return `${e.toFixed(2)} ETH`;
  return `${e.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")} ETH`;
}

/**
 * Live feed of profile coins launched through Dime. Refreshes on an interval
 * and ranks by market cap, so a coin that gets bought rises up the list.
 */
export function TokenFeed({ limit = 48 }: { limit?: number }) {
  const [items, setItems] = useState<LaunchItem[] | null>(null);
  const [mcaps, setMcaps] = useState<Record<string, McInfo>>({});

  // Poll the launch list.
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch(`/api/launches?limit=${limit}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => !cancelled && setItems(d.items ?? []))
        .catch(() => !cancelled && setItems((prev) => prev ?? []));
    load();
    const id = setInterval(load, 20_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [limit]);

  // Poll market caps for the listed tokens (best-effort, one batched request).
  useEffect(() => {
    if (!items || items.length === 0) return;
    let cancelled = false;
    const tokens = items.map((i) => i.token).join(",");
    const load = () =>
      fetch(`/api/v2/prices?tokens=${tokens}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (cancelled || !d.prices) return;
          const next: Record<string, McInfo> = {};
          for (const [k, v] of Object.entries(d.prices as Record<string, { marketCapEth: number; marketCapUsd: number | null }>)) {
            if (v && typeof v.marketCapEth === "number") next[k] = { eth: v.marketCapEth, usd: v.marketCapUsd ?? null };
          }
          setMcaps(next);
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [items]);

  // Rank by market cap (bought coins rise); unpriced new coins fall in by recency.
  const ranked = useMemo(() => {
    if (!items) return null;
    return [...items].sort((a, b) => {
      const ma = mcaps[a.token.toLowerCase()]?.eth;
      const mb = mcaps[b.token.toLowerCase()]?.eth;
      if (ma != null && mb != null) return mb - ma;
      if (ma != null) return -1;
      if (mb != null) return 1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [items, mcaps]);

  if (ranked === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  if (ranked.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-sm text-zinc-600">No profiles launched on Dime yet. Be the first.</p>
        <Link href="/create" className="btn-brand mt-4 inline-flex">Launch my profile →</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ranked.map((it, rank) => {
        const mc = mcaps[it.token.toLowerCase()];
        return (
          <div key={it.token} className="card card-hover flex flex-col p-4 transition-all duration-500">
            <Link href={`/launch/${it.token}`} className="flex items-center gap-3">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink-line bg-white">
                {it.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.logo} alt={it.symbol ?? "token"} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg">🫥</span>
                )}
                {rank < 3 && (
                  <span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                    {rank + 1}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold text-zinc-900">{it.name || short(it.token)}</div>
                {it.symbol && <div className="font-mono text-xs text-pink">${it.symbol}</div>}
              </div>
              {mc && (
                <div className="shrink-0 text-right">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500">MC</div>
                  <div className="text-sm font-bold text-zinc-900">{fmtMc(mc)}</div>
                </div>
              )}
            </Link>

            <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
              {it.handle ? (
                <a
                  href={`https://fomo.family/${it.handle.replace(/^@+/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate font-medium text-pink hover:underline"
                  title="Fee recipient · fomo.family profile"
                >
                  @{it.handle.replace(/^@+/, "")}
                </a>
              ) : (
                <span className="font-mono">by {short(it.deployer)}</span>
              )}
              <span>{ago(it.createdAt)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
