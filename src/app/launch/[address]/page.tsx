"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { isAddress, zeroAddress, type Address } from "viem";
import { CurveTradeWidget } from "@/components/CurveTradeWidget";
import { PriceChartV2 } from "@/components/PriceChartV2";
import { ClaimFees } from "@/components/ClaimFees";
import { TokenComments } from "@/components/TokenComments";
import { explorerToken, explorerUrl } from "@/lib/chain";

interface CurveData {
  quoteReserve: string;
  tokenReserve: string;
  sellableTokens: string;
  feeBps: string;
  creatorTaxBps: string;
  progress: number;
  graduated: boolean;
  readyToGraduate: boolean;
}

interface TokenData {
  token: string;
  name: string;
  symbol: string;
  decimals: number;
  logo: string;
  description: string;
  deployer: string;
  curveAddress: string;
  pairToken: string;
  phase: number;
  phaseLabel: string;
  creatorFeeRecipient: string;
  priceEth: number | null;
  marketCapEth: number | null;
  priceUsd: number | null;
  marketCapUsd: number | null;
  totalSupply: string | null;
  curve: CurveData | null;
  error?: string;
}

function short(a: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

export default function ProfileCoinPage() {
  const params = useParams<{ address: string }>();
  const address = params?.address ?? "";
  const [data, setData] = useState<TokenData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function copyCa(value: string) {
    navigator.clipboard?.writeText(value).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {},
    );
  }

  useEffect(() => {
    if (!address || !isAddress(address)) {
      setError("Invalid token address.");
      return;
    }
    let cancelled = false;
    fetch(`/api/v2/token?address=${address}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => !cancelled && setError("Couldn’t load this profile coin."));
    return () => {
      cancelled = true;
    };
  }, [address]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-16 text-center">
        <div className="card p-10">
          <p className="text-sm text-zinc-600">{error}</p>
          <Link href="/" className="btn-ghost mt-4 inline-flex">← Back to home</Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-5xl px-4 pt-14">
        <div className="card h-64 animate-pulse" />
      </div>
    );
  }

  const onCurve = data.phase === 0 && data.curve && !data.curve.graduated;
  const pairToken = (data.pairToken || zeroAddress) as Address;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:pt-14">
      {/* Header */}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-ink-line bg-white">
            {data.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.logo} alt={data.symbol} className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl">🫥</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-black text-zinc-900">{data.name}</h1>
              <span className="font-mono text-sm text-pink">${data.symbol}</span>
              <span className="chip">{data.phaseLabel}</span>
              {data.curve?.readyToGraduate && <span className="chip chip-accent">ready to graduate</span>}
            </div>
            {data.description && <p className="mt-1 max-w-xl text-sm text-zinc-600">{data.description}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500">
              <button
                onClick={() => copyCa(data.token)}
                className="inline-flex items-center gap-1 font-mono transition hover:text-pink"
                title="Copy contract address"
              >
                CA {short(data.token)}
                <span className="not-italic">{copied ? "✓ Copied" : "⧉"}</span>
              </button>
              <a href={explorerToken(data.token)} target="_blank" rel="noreferrer" className="hover:text-pink">
                Explorer ↗
              </a>
              <span>Creator {short(data.deployer)}</span>
              {data.curveAddress && data.curveAddress !== zeroAddress && (
                <a href={`${explorerUrl}/address/${data.curveAddress}`} target="_blank" rel="noreferrer" className="hover:text-pink">
                  Curve {short(data.curveAddress)} ↗
                </a>
              )}
            </div>
          </div>
        </div>

        {onCurve && data.curve && (
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
              <div
                className="h-full rounded-full bg-pink"
                style={{ width: `${Math.min(100, Math.max(2, data.curve.progress * 100)).toFixed(0)}%` }}
              />
            </div>
            <div className="mt-1 text-right text-[11px] text-zinc-500">
              {(data.curve.progress * 100).toFixed(1)}% to graduation
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,0.85fr]">
        <div className="space-y-6">
          <PriceChartV2
            token={data.token}
            marketCapUsd={data.marketCapUsd}
            marketCapEth={data.marketCapEth}
            quoteSymbol={data.pairToken && data.pairToken !== zeroAddress ? "quote" : "ETH"}
          />
          <ClaimFees pairToken={pairToken} creator={data.creatorFeeRecipient as Address} />
          <TokenComments token={data.token as `0x${string}`} symbol={data.symbol} />
        </div>

        <div className="space-y-6">
          {onCurve && data.curve ? (
            <CurveTradeWidget
              curveAddress={data.curveAddress as Address}
              token={data.token as Address}
              symbol={data.symbol}
              decimals={data.decimals}
              pairToken={pairToken}
              curve={{
                quoteReserve: data.curve.quoteReserve,
                tokenReserve: data.curve.tokenReserve,
                sellableTokens: data.curve.sellableTokens,
                feeBps: data.curve.feeBps,
                creatorTaxBps: data.curve.creatorTaxBps,
              }}
            />
          ) : (
            <div className="card p-5 text-sm text-zinc-600">
              <h2 className="text-sm font-medium text-zinc-700">Trading</h2>
              <p className="mt-2">
                This profile coin has graduated off the bonding curve. Trade it on the graduated
                Uniswap V4 pool via the explorer.
              </p>
              <a href={explorerToken(data.token)} target="_blank" rel="noreferrer" className="btn-ghost mt-3 inline-flex">
                View on explorer ↗
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
