"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { Logo } from "./Logo";

interface Price {
  priceEth: number;
  marketCapEth: number;
  marketCapUsd: number | null;
}

function fmtUsd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toPrecision(3)}`;
}
function fmtEth(n: number): string {
  if (n >= 1) return `${n.toFixed(2)} ETH`;
  return `${n.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")} ETH`;
}
function fmtPriceUsd(n: number): string {
  if (n >= 1) return `$${n.toFixed(3)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toPrecision(3)}`;
}
function fmtAmt(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
function short(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

/**
 * Official $KORE token banner — live market cap + price pulled from the Pons
 * bonding curve (via /api/v2/prices), plus the verified contract address.
 */
export function KoreTokenCard() {
  const ca = SITE.koreToken;
  const [price, setPrice] = useState<Price | null>(null);
  const [burned, setBurned] = useState<{ burned: number; pct: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch(`/api/v2/prices?tokens=${ca}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return;
          const p = d?.prices?.[ca.toLowerCase()];
          if (p && typeof p.marketCapEth === "number") setPrice(p as Price);
        })
        .catch(() => {});
      fetch(`/api/kore/burned?token=${ca}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return;
          if (d && typeof d.burned === "number") setBurned({ burned: d.burned, pct: d.pct ?? 0 });
        })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [ca]);

  const mc = price ? (price.marketCapUsd != null ? fmtUsd(price.marketCapUsd) : fmtEth(price.marketCapEth)) : "—";
  const ethUsd = price && price.marketCapUsd != null && price.marketCapEth > 0 ? price.marketCapUsd / price.marketCapEth : null;
  const priceUsd = price && ethUsd != null ? fmtPriceUsd(price.priceEth * ethUsd) : null;

  const copy = () => {
    navigator.clipboard?.writeText(ca).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {},
    );
  };

  return (
    <div className="card relative overflow-hidden p-5 sm:p-6">
      {/* aurora wash */}
      <div
        className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(123,92,255,0.5), transparent 62%)" }}
        aria-hidden
      />
      <div className="relative flex flex-wrap items-center gap-4">
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
            <span className="pulse-dot" /> Live on {SITE.poweredBy}
          </div>
        </div>

        {/* live stats */}
        <div className="ml-auto flex flex-wrap items-center justify-end gap-x-6 gap-y-3">
          <div className="text-right">
            <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Market cap</div>
            <div className="ink-sheen font-display text-2xl font-extrabold">{mc}</div>
          </div>
          <div className="hidden text-right sm:block">
            <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Price</div>
            <div className="font-display text-2xl font-extrabold text-zinc-900">{priceUsd ?? "—"}</div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              <span className="pulse-dot" style={{ background: "#ff8a4c", boxShadow: "0 0 0 4px rgba(255,138,76,0.22)" }} />
              Burned
            </div>
            <div className="font-display text-2xl font-extrabold" style={{ color: "#ff9d5c" }}>
              {burned ? fmtAmt(burned.burned) : "—"}
              {burned && burned.pct > 0 && (
                <span className="ml-1 align-middle font-mono text-xs text-zinc-500">
                  {burned.pct >= 0.01 ? burned.pct.toFixed(2) : burned.pct.toFixed(3)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CA + actions */}
      <div className="relative mt-5 flex flex-wrap items-center gap-3 border-t border-ink-line pt-4">
        <button
          type="button"
          onClick={copy}
          title="Copy contract address"
          className="inline-flex items-center gap-2 rounded-lg border border-ink-line bg-white/[0.04] px-3 py-2 font-mono text-xs text-zinc-600 transition hover:text-zinc-900"
        >
          <span className="text-zinc-500">CA</span>
          <span className="text-zinc-900">{short(ca)}</span>
          <span className="text-pink-soft">{copied ? "copied ✓" : "copy"}</span>
        </button>
        <Link href={`/launch/${ca}`} className="btn-brand ml-auto !py-2.5">Trade ${SITE.koreSymbol} →</Link>
      </div>
    </div>
  );
}
