"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { resolveLogo, gradientFor } from "@/lib/img";

/** A profile coin launched through Kore (from /api/launches). */
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
 * Live feed of profile coins launched through Kore. Refreshes on an interval
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card aspect-[3/4] animate-pulse" />
        ))}
      </div>
    );
  }

  if (ranked.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-sm text-zinc-600">No profiles launched on Kore yet. Be the first.</p>
        <Link href="/create" className="btn-brand mt-4 inline-flex">Launch my profile →</Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {ranked.map((it, rank) => {
        const mc = mcaps[it.token.toLowerCase()];
        const logo = resolveLogo(it.logo);
        const sym = (it.symbol || it.name || "◈").toUpperCase();
        return (
          <Link
            key={it.token}
            href={`/launch/${it.token}`}
            className="card card-hover flex flex-col overflow-hidden"
          >
            {/* square token art */}
            <div className="relative aspect-square w-full overflow-hidden">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={sym} className="h-full w-full object-cover" />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center font-display text-4xl font-black text-[#08060f]"
                  style={{ background: gradientFor(it.symbol || it.token) }}
                >
                  {sym.slice(0, 1)}
                </div>
              )}
              {rank < 3 && (
                <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-lg bg-black/55 font-mono text-[11px] font-bold text-white backdrop-blur">
                  {rank + 1}
                </span>
              )}
            </div>

            {/* meta */}
            <div className="flex flex-1 flex-col p-3.5">
              <div className="truncate font-display text-[15px] font-bold text-zinc-900">
                {it.name || short(it.token)}
              </div>
              <div className="truncate font-mono text-xs text-pink-soft">${sym}</div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">MC</div>
                  <div className="font-display text-base font-extrabold text-zinc-900">
                    {mc ? fmtMc(mc) : "—"}
                  </div>
                </div>
                <span className="pb-0.5 font-mono text-[11px] text-zinc-500">{ago(it.createdAt)}</span>
              </div>

              <div className="mt-2 truncate border-t border-ink-line pt-2 text-[11px] text-zinc-500">
                {it.handle ? (
                  <span className="font-medium text-pink-soft">@{it.handle.replace(/^@+/, "")}</span>
                ) : (
                  <span className="font-mono">{short(it.deployer)}</span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
