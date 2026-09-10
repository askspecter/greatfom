import { NextResponse } from "next/server";
import { isAddress, parseAbi, zeroAddress, type Address } from "viem";
import { getCurveState, getLaunchedTokenV2 } from "@/lib/pons/readerV2";
import { ponsClient } from "@/lib/pons/reader";
import { ethUsd } from "@/lib/eth-price";
import { getKv } from "@/lib/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/v2/prices?tokens=0x..,0x..
 * Market cap (in the quote asset, ETH for native pairs) for a batch of tokens,
 * for the feed cards. Reads run through the batched RPC client and each token
 * is cached, so a whole feed page costs at most one batched RPC round trip.
 * Best-effort: a token that can't be read is simply omitted.
 */
const erc20Supply = parseAbi(["function totalSupply() view returns (uint256)"]);
const PRICE_TTL = 60; // seconds
const cacheKey = (t: string) => `price:v2:${t.toLowerCase()}`;

interface Price {
  priceEth: number;
  marketCapEth: number;
  marketCapUsd: number | null;
}

async function readPrice(token: Address, usd: number | null): Promise<Price | null> {
  const record = await getLaunchedTokenV2(token).catch(() => null);
  if (!record || !record.exists || record.phase !== 0 || !record.curve || record.curve === zeroAddress) {
    return null;
  }
  const [curve, supplyRaw] = await Promise.all([
    getCurveState(record.curve).catch(() => null),
    ponsClient()
      .readContract({ address: token, abi: erc20Supply, functionName: "totalSupply" })
      .catch(() => null),
  ]);
  if (!curve || supplyRaw == null) return null;
  const supply = Number(supplyRaw as bigint) / 1e18; // factory tokens are 18-decimals
  const priceEth = curve.spotPrice;
  const marketCapEth = priceEth * supply;
  const isNative = !record.pairToken || record.pairToken === zeroAddress;
  return { priceEth, marketCapEth, marketCapUsd: isNative && usd != null ? marketCapEth * usd : null };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tokens = (searchParams.get("tokens") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter((t): t is Address => isAddress(t))
    .slice(0, 24);

  if (tokens.length === 0) return NextResponse.json({ prices: {} });

  const kv = getKv();
  const prices: Record<string, Price> = {};
  const misses: Address[] = [];

  if (kv) {
    await Promise.all(
      tokens.map(async (t) => {
        try {
          const hit = await kv.get<Price>(cacheKey(t));
          if (hit) prices[t.toLowerCase()] = hit;
          else misses.push(t);
        } catch {
          misses.push(t);
        }
      }),
    );
  } else {
    misses.push(...tokens);
  }

  // Read the misses (batched by the RPC client), best-effort.
  const usd = misses.length > 0 ? await ethUsd() : null;
  await Promise.all(
    misses.map(async (t) => {
      const p = await readPrice(t, usd).catch(() => null);
      if (!p) return;
      prices[t.toLowerCase()] = p;
      if (kv) {
        try {
          await kv.set(cacheKey(t), p, { ex: PRICE_TTL });
        } catch {
          // ignore
        }
      }
    }),
  );

  return NextResponse.json({ prices });
}
