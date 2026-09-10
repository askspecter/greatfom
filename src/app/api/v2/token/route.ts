import { NextResponse } from "next/server";
import { isAddress, parseAbi, zeroAddress, type Address } from "viem";
import { getCurveState, getLaunchedTokenV2, phaseLabel, readTokenInfoV2 } from "@/lib/pons/readerV2";
import { ponsClient } from "@/lib/pons/reader";
import { ethUsd } from "@/lib/eth-price";
import { getKv } from "@/lib/kv";

const erc20Supply = parseAbi(["function totalSupply() view returns (uint256)"]);
const chartKey = (t: string) => `chart:v2:${t.toLowerCase()}`;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v2/token?address=0x...
 * Live post-launch state for a Pons v2 token: metadata, phase, and (while on
 * the curve) reserves + progress + fee rates for the trade widget.
 *
 * The public Robinhood RPC rate-limits hard, so a popular token viewed by many
 * people would otherwise fail on every load. We cache the assembled response
 * briefly, and keep a durable last-known copy to serve when a live read hits a
 * rate limit — the page shows slightly stale data instead of an error card.
 */
const FRESH_TTL = 20; // seconds
const freshKey = (t: string) => `token:v2:fresh:${t.toLowerCase()}`;
const lastKey = (t: string) => `token:v2:last:${t.toLowerCase()}`;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: "The `address` param is not a valid address." }, { status: 400 });
  }
  const token = address as Address;
  const kv = getKv();

  // Fast path: a fresh cached response (shared across all viewers).
  if (kv) {
    try {
      const cached = await kv.get<Record<string, unknown>>(freshKey(token));
      if (cached) return NextResponse.json({ ...cached, cached: true });
    } catch {
      // ignore cache read errors
    }
  }

  try {
    const [record, info, supplyRaw] = await Promise.all([
      getLaunchedTokenV2(token),
      readTokenInfoV2(token),
      ponsClient()
        .readContract({ address: token, abi: erc20Supply, functionName: "totalSupply" })
        .catch(() => null),
    ]);
    if (!record.exists) {
      return NextResponse.json({ error: "No Pons v2 launch found for this token." }, { status: 404 });
    }

    // Curve state only matters while still on the curve (phase 0).
    let curve: Awaited<ReturnType<typeof getCurveState>> | null = null;
    if (record.phase === 0 && record.curve && record.curve !== zeroAddress) {
      curve = await getCurveState(record.curve);
    }

    // Price + market cap in the quote asset (ETH for native pairs). spotPrice is
    // quote-per-token; market cap is that times the human token supply.
    const priceEth = curve ? curve.spotPrice : null;
    const humanSupply =
      supplyRaw != null ? Number(supplyRaw as bigint) / 10 ** info.decimals : null;
    const marketCapEth = priceEth != null && humanSupply != null ? priceEth * humanSupply : null;

    // USD figures (native ETH pairs only; RWA pairs keep the quote asset).
    const isNative = !record.pairToken || record.pairToken === zeroAddress;
    const usd = isNative ? await ethUsd() : null;
    const priceUsd = usd != null && priceEth != null ? priceEth * usd : null;
    const marketCapUsd = usd != null && marketCapEth != null ? marketCapEth * usd : null;

    const payload = {
      token,
      name: info.name,
      symbol: info.symbol,
      decimals: info.decimals,
      logo: info.logo,
      description: info.description,
      deployer: record.deployer,
      curveAddress: record.curve,
      pairToken: record.pairToken,
      phase: record.phase,
      phaseLabel: phaseLabel(record.phase),
      buybackEnabled: record.buybackEnabled,
      creatorFeeRecipient: record.creatorFeeRecipient,
      totalSupply: supplyRaw != null ? (supplyRaw as bigint).toString() : null,
      priceEth,
      marketCapEth,
      priceUsd,
      marketCapUsd,
      curve: curve
        ? {
            quoteReserve: curve.quoteReserve.toString(),
            tokenReserve: curve.tokenReserve.toString(),
            realQuoteReserve: curve.realQuoteReserve.toString(),
            graduationThreshold: curve.graduationThreshold.toString(),
            sellableTokens: curve.sellableTokens.toString(),
            readyToGraduate: curve.readyToGraduate,
            graduated: curve.graduated,
            spotPrice: curve.spotPrice,
            progress: curve.progress,
            feeBps: curve.feeBps.toString(),
            creatorTaxBps: curve.creatorTaxBps.toString(),
          }
        : null,
    };

    if (kv) {
      try {
        await kv.set(freshKey(token), payload, { ex: FRESH_TTL });
        await kv.set(lastKey(token), payload); // durable fallback for rate-limit windows
        // Append a price/market-cap sample so the chart builds a real time series
        // (no heavy event scan). One sample per fresh read (~1 / 20s when viewed).
        const mc = marketCapUsd ?? marketCapEth;
        if (mc != null && mc > 0) {
          await kv.lpush(chartKey(token), JSON.stringify({ t: Date.now(), mc, p: priceUsd ?? priceEth }));
          await kv.ltrim(chartKey(token), 0, 999);
        }
      } catch {
        // ignore cache write errors
      }
    }

    return NextResponse.json(payload);
  } catch (err) {
    // On a live-read failure (usually an RPC rate limit), serve the last-known
    // snapshot rather than an error, so the page still renders.
    if (kv) {
      try {
        const last = await kv.get<Record<string, unknown>>(lastKey(token));
        if (last) return NextResponse.json({ ...last, stale: true });
      } catch {
        // ignore
      }
    }
    const raw = err instanceof Error ? err.message : "";
    const message = /rate limit|429|timeout|fetch failed/i.test(raw)
      ? "Robinhood Chain is busy right now. Try again in a moment."
      : raw || "Failed to read the token from chain.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
