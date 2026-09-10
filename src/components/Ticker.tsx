"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface LaunchItem {
  token: string;
  name: string;
  symbol: string;
}
interface McInfo {
  eth: number;
  usd: number | null;
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
 * Slim live marquee of the latest profile coins, pinned above the header.
 * Best-effort: renders nothing until there is at least one launch, so the
 * page never shows an empty bar.
 */
export function Ticker() {
  const [items, setItems] = useState<LaunchItem[]>([]);
  const [mcaps, setMcaps] = useState<Record<string, McInfo>>({});

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch(`/api/launches?limit=20`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => !cancelled && setItems(d.items ?? []))
        .catch(() => {});
    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    const tokens = items.map((i) => i.token).join(",");
    const load = () =>
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
    load();
    const id = setInterval(load, 20_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [items]);

  const row = useMemo(() => items.filter((i) => i.symbol || i.name), [items]);

  if (row.length === 0) return null;

  const Cell = ({ it }: { it: LaunchItem }) => {
    const mc = mcaps[it.token.toLowerCase()];
    return (
      <Link
        href={`/launch/${it.token}`}
        className="inline-flex items-center gap-2 font-mono text-[12.5px] tracking-tight text-zinc-500 transition hover:text-zinc-900"
      >
        <span className="font-bold text-zinc-900">${(it.symbol || it.name).toUpperCase()}</span>
        {mc && <span className="text-zinc-500">{fmtMc(mc)}</span>}
      </Link>
    );
  };

  // Render the row twice so the -50% marquee loops seamlessly.
  const doubled = [...row, ...row];

  return (
    <div className="relative z-40 border-b border-ink-line bg-white/[0.02] backdrop-blur-xl">
      <div className="marquee-mask overflow-hidden">
        <div className="marquee-track gap-10 py-2.5">
          {doubled.map((it, i) => (
            <Cell key={`${it.token}-${i}`} it={it} />
          ))}
        </div>
      </div>
    </div>
  );
}
