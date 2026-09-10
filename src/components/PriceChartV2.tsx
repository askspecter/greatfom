"use client";

import { useEffect, useMemo, useState } from "react";

interface Sample {
  t: number;
  mc: number;
  p: number | null;
}

const RANGES = [
  { id: "1h", label: "1H", ms: 60 * 60_000 },
  { id: "6h", label: "6H", ms: 6 * 60 * 60_000 },
  { id: "1d", label: "1D", ms: 24 * 60 * 60_000 },
  { id: "all", label: "ALL", ms: Infinity },
] as const;

/**
 * Market-cap chart for a profile coin. The headline market cap comes from the
 * live curve read (always present); the line is built from lightweight samples
 * the server records over time, so it is fast and fills in as the coin trades.
 */
export function PriceChartV2({
  token,
  marketCapUsd,
  marketCapEth,
  quoteSymbol = "ETH",
}: {
  token: string;
  marketCapUsd?: number | null;
  marketCapEth?: number | null;
  quoteSymbol?: string;
}) {
  const [samples, setSamples] = useState<Sample[] | null>(null);
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("1d");

  useEffect(() => {
    let cancelled = false;
    const done = setTimeout(() => !cancelled && setSamples((s) => s ?? []), 6000);
    fetch(`/api/v2/token/chart?address=${token}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => !cancelled && setSamples(d.points ?? []))
      .catch(() => !cancelled && setSamples([]))
      .finally(() => clearTimeout(done));
    return () => {
      cancelled = true;
      clearTimeout(done);
    };
  }, [token]);

  const usd = marketCapUsd != null && marketCapUsd > 0;
  const headline = usd ? fmtUsd(marketCapUsd as number) : marketCapEth != null ? `${fmtNum(marketCapEth)} ${quoteSymbol}` : "—";

  const windowed = useMemo(() => {
    if (!samples) return [];
    const ms = RANGES.find((r) => r.id === range)!.ms;
    const cutoff = Date.now() - ms;
    const pts = samples.filter((s) => s.t >= cutoff);
    return pts.length >= 2 ? pts : samples; // fall back to full series if the window is thin
  }, [samples, range]);

  const first = windowed.length ? windowed[0].mc : 0;
  const last = windowed.length ? windowed[windowed.length - 1].mc : 0;
  const change = first > 0 ? ((last - first) / first) * 100 : 0;
  const up = change >= 0;

  return (
    <section className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Market cap</div>
          <div className="mt-1 text-3xl font-black tracking-tight text-zinc-900">{headline}</div>
          {windowed.length >= 2 && (
            <div className={`mt-1 text-sm font-semibold ${up ? "text-emerald-500" : "text-red-600"}`}>
              {up ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%{" "}
              <span className="text-zinc-500">{RANGES.find((r) => r.id === range)!.label}</span>
            </div>
          )}
        </div>
        <div className="flex rounded-full border border-ink-line bg-white/5 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                range === r.id ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {samples === null ? (
        <div className="mt-4 h-44 animate-pulse rounded-xl bg-white/5" />
      ) : (
        <Chart points={windowed.map((s) => s.mc)} up={up} />
      )}
    </section>
  );
}

function Chart({ points, up }: { points: number[]; up: boolean }) {
  const W = 600;
  const H = 176;
  const pad = 10;
  const flat = points.length < 2;
  const min = points.length ? Math.min(...points) : 0;
  const max = points.length ? Math.max(...points) : 1;
  const range = max - min || 1;

  const coord = (v: number, i: number, n: number) => {
    const x = pad + (n <= 1 ? 0 : (i / (n - 1)) * (W - pad * 2));
    const y = flat ? H * 0.55 : pad + (1 - (v - min) / range) * (H - pad * 2);
    return [x, y] as const;
  };

  const drawn = flat ? [coord(0, 0, 2), coord(0, 1, 2)] : points.map((v, i) => coord(v, i, points.length));
  const line = drawn.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${(W - pad).toFixed(1)},${H} L${pad},${H} Z`;
  const stroke = flat ? "#a9b8ff" : up ? "#34d399" : "#f87171";
  const [lastX, lastY] = drawn[drawn.length - 1];

  return (
    <div className="mt-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-44 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mcfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={stroke} stopOpacity="0.22" />
            <stop offset="1" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {!flat && <path d={area} fill="url(#mcfill)" stroke="none" />}
        <path d={line} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {!flat && <circle cx={lastX} cy={lastY} r="3.5" fill={stroke} />}
      </svg>
      <p className="mt-1 text-[10px] text-zinc-500">
        {flat ? "The chart fills in as the coin is viewed and traded." : `${points.length} points`}
      </p>
    </div>
  );
}

function fmtUsd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function fmtNum(x: number): string {
  if (x >= 1000) return x.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (x >= 1) return x.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return x.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}
