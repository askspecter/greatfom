"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { Logo } from "@/components/Logo";
import { PayoutChecker } from "@/components/PayoutChecker";
import { explorerToken, explorerUrl } from "@/lib/chain";

interface Price {
  priceEth: number;
  marketCapEth: number;
  marketCapUsd: number | null;
}
interface Burned {
  burned: number;
  pct: number;
}
interface Holder {
  address: string;
  value: number;
  pct: number;
  isBurn: boolean;
}
interface Holders {
  holdersCount: number | null;
  supply: number | null;
  volume24h: number | null;
  top: Holder[];
}

function usd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toPrecision(3)}`;
}
function amt(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
function short(a: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

export default function KoreDashboard() {
  const ca = SITE.koreToken;
  const [price, setPrice] = useState<Price | null>(null);
  const [burned, setBurned] = useState<Burned | null>(null);
  const [holders, setHolders] = useState<Holders | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch(`/api/v2/prices?tokens=${ca}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => !cancelled && d?.prices?.[ca.toLowerCase()] && setPrice(d.prices[ca.toLowerCase()]))
        .catch(() => {});
      fetch(`/api/kore/burned?token=${ca}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => !cancelled && typeof d?.burned === "number" && setBurned({ burned: d.burned, pct: d.pct ?? 0 }))
        .catch(() => {});
      fetch(`/api/kore/holders?token=${ca}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => !cancelled && setHolders(d))
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 20_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [ca]);

  const mc = price ? (price.marketCapUsd != null ? usd(price.marketCapUsd) : `${price.marketCapEth.toFixed(2)} ETH`) : "—";
  const copy = () =>
    navigator.clipboard?.writeText(ca).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }, () => {});

  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:pt-14">
      {/* Header */}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Logo className="h-14 w-14 shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-extrabold text-zinc-900">Kore</span>
              <span className="font-mono text-sm font-bold text-pink-soft">${SITE.koreSymbol}</span>
              <span className="rounded-md border border-[rgba(56,229,204,0.35)] bg-[rgba(56,229,204,0.1)] px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-pink-soft">
                Official
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 font-mono text-xs text-zinc-500">
              <span className="pulse-dot" /> Holder dashboard · Live on {SITE.poweredBy}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-2 rounded-lg border border-ink-line bg-white/[0.04] px-3 py-2 font-mono text-xs text-zinc-600 transition hover:text-zinc-900"
            >
              <span className="text-zinc-500">CA</span>
              <span className="text-zinc-900">{short(ca)}</span>
              <span className="text-pink-soft">{copied ? "copied ✓" : "copy"}</span>
            </button>
            <Link href={`/launch/${ca}`} className="btn-brand !py-2.5">Trade ${SITE.koreSymbol} →</Link>
          </div>
        </div>
      </div>

      {/* Two headline cards */}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {/* Burned (real) */}
        <div className="card relative overflow-hidden p-6">
          <div
            className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(255,138,76,0.55), transparent 62%)" }}
            aria-hidden
          />
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-zinc-500">
            <span className="pulse-dot" style={{ background: "#ff8a4c", boxShadow: "0 0 0 4px rgba(255,138,76,0.22)" }} />
            Bought back &amp; burned
          </div>
          <div className="mt-2 font-display text-5xl font-extrabold" style={{ color: "#ff9d5c" }}>
            {burned ? amt(burned.burned) : "—"}
          </div>
          <div className="mt-1 font-mono text-sm text-zinc-500">
            {burned ? `${burned.pct >= 0.01 ? burned.pct.toFixed(2) : burned.pct.toFixed(3)}% of supply` : "reading on-chain…"}
          </div>
          <p className="mt-5 border-t border-ink-line pt-4 text-xs leading-relaxed text-zinc-500">
            Every cycle, protocol fees buy back $KORE and burn it. Supply only shrinks. This is read
            live from the burn addresses on-chain.
          </p>
        </div>

        {/* ETH payouts — soon */}
        <div className="card relative overflow-hidden p-6">
          <div
            className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(78,240,163,0.5), transparent 62%)" }}
            aria-hidden
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-zinc-500">
              ETH payouts to holders
            </div>
            <span className="rounded-full border border-[rgba(78,240,163,0.35)] bg-[rgba(78,240,163,0.1)] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: "#7ef0b8" }}>
              Soon
            </span>
          </div>
          <div className="mt-2 font-display text-5xl font-extrabold text-zinc-900">Coming soon</div>
          <div className="mt-1 font-mono text-sm text-zinc-500">Direct ETH rewards, per round</div>
          <p className="mt-5 border-t border-ink-line pt-4 text-xs leading-relaxed text-zinc-500">
            We are building automatic ETH payouts to $KORE holders, swept and distributed each round.
            For now, value routes to holders through buybacks and burns above.
          </p>
        </div>
      </div>

      {/* Payout checker */}
      <div className="mt-5">
        <PayoutChecker token={ca} />
      </div>

      {/* Stat row */}
      <div className="card mt-5 p-5 sm:p-6">
        <div className="grid grid-cols-3 gap-4 text-center sm:text-left">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Market cap</div>
            <div className="ink-sheen mt-1 font-display text-2xl font-extrabold sm:text-3xl">{mc}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Holders</div>
            <div className="mt-1 font-display text-2xl font-extrabold text-zinc-900 sm:text-3xl">
              {holders?.holdersCount != null ? holders.holdersCount.toLocaleString() : "—"}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Burned</div>
            <div className="mt-1 font-display text-2xl font-extrabold sm:text-3xl" style={{ color: "#ff9d5c" }}>
              {burned ? `${burned.pct >= 0.01 ? burned.pct.toFixed(2) : burned.pct.toFixed(3)}%` : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Top holders */}
      <div className="card mt-5 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold text-zinc-900">Top holders</h2>
          <a href={`${explorerToken(ca)}?tab=holders`} target="_blank" rel="noreferrer" className="font-mono text-xs uppercase tracking-widest text-pink-soft hover:underline">
            All holders →
          </a>
        </div>

        <div className="mt-4 overflow-x-auto">
          {holders === null ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-11 animate-pulse rounded-lg bg-white/5" />
              ))}
            </div>
          ) : holders.top.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">
              Holder list is momentarily unavailable. View it on the{" "}
              <a href={`${explorerToken(ca)}?tab=holders`} target="_blank" rel="noreferrer" className="text-pink-soft hover:underline">
                explorer
              </a>
              .
            </p>
          ) : (
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink-line font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  <th className="py-2 pr-3 text-left font-normal">#</th>
                  <th className="py-2 pr-3 text-left font-normal">Wallet</th>
                  <th className="py-2 pr-3 text-right font-normal">Balance</th>
                  <th className="py-2 text-right font-normal">Share</th>
                </tr>
              </thead>
              <tbody>
                {holders.top.map((h, i) => (
                  <tr key={h.address} className="border-b border-ink-line/60 last:border-0">
                    <td className="py-2.5 pr-3 font-mono text-xs text-zinc-500">{i + 1}</td>
                    <td className="py-2.5 pr-3">
                      <a
                        href={`${explorerUrl}/address/${h.address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-zinc-800 hover:text-pink-soft"
                      >
                        {short(h.address)}
                      </a>
                      {h.isBurn && (
                        <span className="ml-2 rounded border border-[rgba(255,138,76,0.35)] bg-[rgba(255,138,76,0.1)] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide" style={{ color: "#ff9d5c" }}>
                          burn
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono text-xs text-zinc-700">{amt(h.value)}</td>
                    <td className="py-2.5 text-right font-mono text-xs text-zinc-900">
                      {h.pct >= 0.01 ? h.pct.toFixed(2) : h.pct.toFixed(3)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p className="mt-4 px-1 text-xs leading-relaxed text-zinc-500">
        USD estimates at current asset rates. Holder counts and balances are computed live from
        on-chain Transfer history. ETH payouts to holders are coming soon; today, value returns to
        holders through on-chain buybacks and burns.
      </p>
    </div>
  );
}
