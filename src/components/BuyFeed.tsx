"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { resolveLogo, gradientFor } from "@/lib/img";

interface BuyItem {
  token: string | null;
  name: string | null;
  symbol: string | null;
  logo: string;
  buyer: string;
  buyerName: string | null;
  buyerHandle: string | null;
  buyerAvatar: string | null;
  buyerVerified: boolean;
  amountQuote: number;
  amountUsd: number | null;
  isNative: boolean;
  block: number;
  txHash: string;
}

function short(a: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}
function fmtUsd(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  if (n >= 1) return `$${n.toFixed(0)}`;
  return `$${n.toFixed(2)}`;
}
function fmtEth(n: number) {
  if (n >= 1) return `${n.toFixed(2)} ETH`;
  return `${n.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")} ETH`;
}
function keyOf(b: BuyItem) {
  return `${b.txHash}-${b.buyer}-${b.block}`;
}

export function BuyFeed() {
  const [items, setItems] = useState<BuyItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const seen = useRef<Set<string>>(new Set());
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch(`/api/buys?limit=40`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return;
          if (d.error && !d.items?.length) {
            setError(d.error);
            return;
          }
          setError(null);
          const next: BuyItem[] = d.items ?? [];
          // Mark rows we haven't shown before so they can flash in.
          const newKeys = new Set<string>();
          for (const b of next) {
            const k = keyOf(b);
            if (!seen.current.has(k)) newKeys.add(k);
          }
          if (seen.current.size > 0 && newKeys.size > 0) {
            setFresh(newKeys);
            setTimeout(() => !cancelled && setFresh(new Set()), 1800);
          }
          for (const b of next) seen.current.add(keyOf(b));
          setItems(next);
        })
        .catch(() => !cancelled && setItems((p) => p ?? []));
    load();
    const id = setInterval(load, 8_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (items === null) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card h-[76px] animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-sm text-zinc-500">
          {error ?? "No buys yet. When someone buys a coin on Kore, it shows up here live."}
        </p>
        <Link href="/explore" className="btn-glass mt-4 inline-flex">Explore coins</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((b) => {
        const isNew = fresh.has(keyOf(b));
        const amount = b.amountUsd != null ? fmtUsd(b.amountUsd) : fmtEth(b.amountQuote);
        const buyer = b.buyerName || short(b.buyer);
        const avatar = resolveLogo(b.buyerAvatar);
        const logo = resolveLogo(b.logo);
        const sym = (b.symbol || "TOKEN").toUpperCase();
        const inner = (
          <div
            className={`card card-hover flex items-center gap-3.5 p-4 ${isNew ? "animate-fade-up ring-1 ring-up/40" : ""}`}
          >
            {/* buyer avatar */}
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt={buyer} className="h-full w-full object-cover" />
              ) : (
                <span className="block h-full w-full" style={{ background: gradientFor(b.buyer) }} />
              )}
            </div>

            {/* text */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-sm">
                <span className="truncate font-semibold text-zinc-900">{buyer}</span>
                {b.buyerVerified && (
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-pink-soft" fill="currentColor">
                    <path d="M12 2l2.4 1.8 3 .1 1 2.8 2.4 1.7-.9 2.8.9 2.8-2.4 1.7-1 2.8-3 .1L12 22l-2.4-1.8-3-.1-1-2.8L3.2 15l.9-2.8-.9-2.8L5.6 7.7l1-2.8 3-.1L12 2z" />
                  </svg>
                )}
                <span className="shrink-0 rounded-md bg-up/15 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-up">
                  Buy
                </span>
              </div>
              <div className="mt-0.5 truncate text-[13px] text-zinc-500">
                <span className="font-semibold text-zinc-700">{amount}</span> of{" "}
                <span className="font-semibold text-zinc-700">${(b.symbol ?? "TOKEN").toUpperCase()}</span>
                {b.name ? ` · ${b.name}` : ""}
              </div>
            </div>

            {/* token logo */}
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-ink-line">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={sym} className="h-full w-full object-cover" />
              ) : (
                <span
                  className="flex h-full w-full items-center justify-center font-display text-sm font-bold text-[#08060f]"
                  style={{ background: gradientFor(b.symbol || b.token || "t") }}
                >
                  {sym.slice(0, 1)}
                </span>
              )}
            </div>
          </div>
        );
        return b.token ? (
          <Link key={keyOf(b)} href={`/launch/${b.token}`} className="block">
            {inner}
          </Link>
        ) : (
          <div key={keyOf(b)}>{inner}</div>
        );
      })}
    </div>
  );
}
