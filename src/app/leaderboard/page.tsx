"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Row {
  rank: number;
  handle: string;
  displayName: string;
  avatar: string | null;
  pnlUsd: number | null;
  followers: number | null;
  holdings: number | null;
  wallets: { evm: string | null; solana: string | null };
  verified: boolean;
}

const WINDOWS = [
  { id: "24h", label: "24h" },
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "all", label: "All" },
] as const;

function usd(n: number | null): string {
  if (n === null) return "N/A";
  const sign = n >= 0 ? "+" : "−";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function medal(rank: number): string {
  return rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}`;
}

export default function LeaderboardPage() {
  const [range, setRange] = useState<(typeof WINDOWS)[number]["id"]>("24h");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    fetch(`/api/fomo/leaderboard?window=${range}&limit=50`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setRows(d.traders ?? []);
        if (d.error) setError(d.error);
      })
      .catch(() => !cancelled && setError("Couldn’t load the leaderboard."));
    return () => {
      cancelled = true;
    };
  }, [range]);

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:pt-14">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
            <span className="grad-text">Leaderboard</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Top fomo.family traders, live from the FOMO API. Tokenize any profile and fees route to
            their wallet.
          </p>
        </div>
      </div>

      {/* Window tabs */}
      <div className="mb-4 inline-flex rounded-full border border-ink-line bg-white/50 p-1">
        {WINDOWS.map((w) => (
          <button
            key={w.id}
            onClick={() => setRange(w.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              range === w.id ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>

      {rows === null ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card h-16 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-zinc-600">
            {error ?? "No leaderboard data yet."}
          </p>
          {error?.includes("configured") && (
            <p className="mt-2 text-xs text-zinc-500">Set FOMO_API_KEY on the server to enable this.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const up = (r.pnlUsd ?? 0) >= 0;
            return (
              <div key={r.handle || r.rank} className="card card-hover flex items-center gap-3 p-3">
                <div className="w-8 shrink-0 text-center text-sm font-bold text-zinc-500">{medal(r.rank)}</div>
                {r.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.avatar}
                    alt={r.handle}
                    className="h-10 w-10 shrink-0 rounded-full border border-ink-line object-cover"
                  />
                ) : (
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-[#0a0b16]"
                    style={{ background: "linear-gradient(135deg,#8fd0ff,#a9b8ff 55%,#c9a2ff)" }}
                  >
                    {(r.displayName || r.handle || "?").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-bold text-zinc-900">{r.displayName || r.handle}</span>
                    {r.verified && <span className="text-pink" title="Verified on fomo.family">✓</span>}
                  </div>
                  <div className="truncate font-mono text-xs text-zinc-500">@{r.handle}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className={`text-sm font-bold ${up ? "text-emerald-500" : "text-red-600"}`}>
                    {usd(r.pnlUsd)}
                  </div>
                  <div className="text-[10px] text-zinc-500">PnL · {range}</div>
                </div>
                <Link
                  href={`/create?handle=${encodeURIComponent(r.handle)}`}
                  className="btn-brand shrink-0 !px-3 !py-2 text-xs"
                >
                  Tokenize
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
