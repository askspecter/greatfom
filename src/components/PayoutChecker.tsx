"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { isAddress } from "viem";
import { SITE } from "@/lib/site";

interface Result {
  wallet: string;
  balance: number;
  share: number;
  isHolder: boolean;
  payoutsLive: boolean;
  ethReceived: number;
  payoutRounds: number;
}

function amt(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * Payout checker: a holder pastes or connects a wallet and sees their REAL
 * on-chain $KORE position (balance + share of supply) and their payout status.
 * ETH payouts are not live yet, so ethReceived is shown honestly as 0 with a
 * "coming soon" note — when payouts ship, this fills with real distributed ETH.
 */
export function PayoutChecker({ token = SITE.koreToken }: { token?: string }) {
  const { address } = useAccount();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function check(addr: string) {
    const a = addr.trim();
    if (!isAddress(a)) {
      setErr("Enter a valid wallet address (0x…).");
      return;
    }
    setErr(null);
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch(`/api/kore/wallet?token=${token}&address=${a}`, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Couldn’t check that wallet.");
      setResult(d as Result);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn’t check that wallet.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card relative overflow-hidden p-5 sm:p-6">
      <div
        className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(123,92,255,0.5), transparent 62%)" }}
        aria-hidden
      />
      <div className="relative flex items-center justify-between">
        <h2 className="font-display text-lg font-extrabold text-zinc-900">Check your payouts</h2>
        <span className="chip chip-accent">ETH payouts soon</span>
      </div>
      <p className="relative mt-1 text-xs text-zinc-500">
        See your live ${SITE.koreSymbol} position and payout status. Paste any wallet or use your connected one.
      </p>

      {/* Input */}
      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && check(input)}
          placeholder="0x… wallet address"
          className="field !py-2.5 font-mono text-sm"
        />
        <button onClick={() => check(input)} disabled={loading} className="btn-brand shrink-0 !py-2.5">
          {loading ? "Checking…" : "Check"}
        </button>
        {address && (
          <button
            onClick={() => {
              setInput(address);
              check(address);
            }}
            disabled={loading}
            className="btn-glass shrink-0 !py-2.5 text-sm"
          >
            Use my wallet
          </button>
        )}
      </div>
      {err && <p className="relative mt-2 text-xs text-red-600">{err}</p>}

      {/* Result */}
      {result && (
        <div className="relative mt-5 border-t border-ink-line pt-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Holding</div>
              <div className="mt-1 font-display text-xl font-extrabold text-zinc-900">
                {amt(result.balance)} <span className="font-mono text-xs text-zinc-500">${SITE.koreSymbol}</span>
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Share of supply</div>
              <div className="mt-1 font-display text-xl font-extrabold text-zinc-900">
                {result.share >= 0.01 ? result.share.toFixed(2) : result.share.toFixed(4)}%
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">ETH received</div>
              <div className="mt-1 font-display text-xl font-extrabold" style={{ color: "#4ef0a3" }}>
                {result.ethReceived.toFixed(4)} <span className="font-mono text-xs text-zinc-500">ETH</span>
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Status</div>
              <div className="mt-1 font-display text-xl font-extrabold text-zinc-900">
                {result.isHolder ? "Eligible" : "Not holding"}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[rgba(78,240,163,0.25)] bg-[rgba(78,240,163,0.06)] p-3 text-xs leading-relaxed text-zinc-600">
            {result.isHolder ? (
              <>
                You hold ${SITE.koreSymbol}, so you’ll be eligible for ETH payouts when they go live, sized by your
                share of supply. Payouts are not live yet, so ETH received is 0 for now. Today, value returns to
                holders through on-chain buybacks and burns.
              </>
            ) : (
              <>
                This wallet holds no ${SITE.koreSymbol} right now. Hold ${SITE.koreSymbol} to be eligible for ETH
                payouts when they launch.
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
