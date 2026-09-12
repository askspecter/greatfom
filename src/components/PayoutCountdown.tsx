"use client";

import { useEffect, useState } from "react";

/**
 * Live countdown to the first ETH payout round. The target instant is a fixed
 * timestamp (overridable via NEXT_PUBLIC_KORE_PAYOUT_ROUND1) so every viewer
 * sees the same clock. When it hits zero it flips to a "snapshot / distributing"
 * state.
 */
const DEFAULT_TARGET = "2026-09-12T14:22:00Z";

function two(n: number) {
  return n.toString().padStart(2, "0");
}

export function PayoutCountdown() {
  const target = (process.env.NEXT_PUBLIC_KORE_PAYOUT_ROUND1 || DEFAULT_TARGET).trim();
  const targetMs = new Date(target).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Avoid hydration mismatch: render a neutral clock until mounted.
  if (now === null) {
    return <div className="font-display text-5xl font-extrabold tabular-nums text-zinc-900">--:--:--</div>;
  }

  const remaining = Math.max(0, targetMs - now);
  if (remaining <= 0) {
    return (
      <div>
        <div className="font-display text-4xl font-extrabold" style={{ color: "#4ef0a3" }}>
          Round 1 is live
        </div>
        <div className="mt-1 font-mono text-sm text-zinc-500">Snapshot taken · distributing ETH to holders</div>
      </div>
    );
  }

  const totalSec = Math.floor(remaining / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  return (
    <div className="font-display text-5xl font-extrabold tabular-nums tracking-tight text-zinc-900 sm:text-6xl">
      {two(h)}
      <span className="text-zinc-500">:</span>
      {two(m)}
      <span className="text-zinc-500">:</span>
      {two(s)}
    </div>
  );
}
