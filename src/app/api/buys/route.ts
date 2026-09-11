import { NextResponse } from "next/server";
import { zeroAddress, type Address } from "viem";
import { indexV2Launches, indexV2BuysForCurves, readTokenInfoV2 } from "@/lib/pons/readerV2";
import { ethUsd } from "@/lib/eth-price";
import { fetchLeaderboard } from "@/lib/fomo/resolve";
import { getKv } from "@/lib/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface TokenMeta {
  name: string;
  symbol: string;
  logo: string;
  decimals: number;
}
interface TraderMeta {
  displayName: string;
  handle: string;
  avatar: string | null;
  verified: boolean;
}

const TOK_TTL = 86_400; // token metadata rarely changes
const LB_TTL = 600; // leaderboard wallet→profile map

/** Token metadata with a KV cache (falls back to a fresh on-chain read). */
async function tokenMeta(token: Address): Promise<TokenMeta> {
  const kv = getKv();
  const key = `kore:tok:${token.toLowerCase()}`;
  if (kv) {
    try {
      const hit = (await kv.get(key)) as TokenMeta | null;
      if (hit && hit.symbol) return hit;
    } catch {}
  }
  const info = await readTokenInfoV2(token);
  const meta: TokenMeta = { name: info.name, symbol: info.symbol, logo: info.logo, decimals: info.decimals };
  if (kv) {
    try {
      await kv.set(key, meta, { ex: TOK_TTL });
    } catch {}
  }
  return meta;
}

/**
 * Wallet → fomo profile map, built from the FOMO leaderboard (the only endpoint
 * that exposes wallets), cached in KV. Lets the feed show a buyer's name + avatar
 * when they're a ranked trader; everyone else falls back to a short address.
 */
async function traderMap(): Promise<Record<string, TraderMeta>> {
  const kv = getKv();
  const key = "kore:lb:wallets";
  if (kv) {
    try {
      const hit = (await kv.get(key)) as Record<string, TraderMeta> | null;
      if (hit) return hit;
    } catch {}
  }
  const map: Record<string, TraderMeta> = {};
  try {
    const { traders } = await fetchLeaderboard("all", 100);
    for (const t of traders) {
      if (t.wallets.evm) {
        map[t.wallets.evm.toLowerCase()] = {
          displayName: t.displayName || t.handle,
          handle: t.handle,
          avatar: t.avatar,
          verified: t.verified,
        };
      }
    }
  } catch {
    // leaderboard unavailable — feed still works with short addresses
  }
  if (kv) {
    try {
      await kv.set(key, map, { ex: LB_TTL });
    } catch {}
  }
  return map;
}

/**
 * GET /api/buys?limit=30
 * Live feed of recent buys on Kore bonding curves (CurveBuy events), newest
 * first, enriched with token metadata, USD value (for native-ETH quotes) and,
 * where known, the buyer's fomo.family name + avatar.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 30), 1), 48);

  try {
    const launches = await indexV2Launches({ limit: 60, lookback: 400_000n });
    if (launches.length === 0) return NextResponse.json({ items: [] });

    const curveInfo = new Map<string, { token: Address; isNative: boolean }>();
    for (const l of launches) {
      curveInfo.set(l.curve.toLowerCase(), { token: l.token, isNative: l.pairToken === zeroAddress });
    }
    const curves = launches.map((l) => l.curve);

    const [buys, eth, traders] = await Promise.all([
      indexV2BuysForCurves(curves, { limit, lookback: 200_000n }),
      ethUsd(),
      traderMap(),
    ]);

    // Enrich unique tokens once.
    const metaCache = new Map<string, TokenMeta>();
    const uniqueTokens = [...new Set(buys.map((b) => curveInfo.get(b.curve.toLowerCase())?.token).filter(Boolean))] as Address[];
    await Promise.all(
      uniqueTokens.map(async (t) => {
        try {
          metaCache.set(t.toLowerCase(), await tokenMeta(t));
        } catch {}
      }),
    );

    const items = buys.map((b) => {
      const info = curveInfo.get(b.curve.toLowerCase());
      const meta = info ? metaCache.get(info.token.toLowerCase()) : undefined;
      const isNative = info?.isNative ?? true;
      const amountQuote = Number(b.quoteIn) / 1e18; // native + most ERC-20 quotes are 18-dec
      const amountUsd = isNative && eth ? amountQuote * eth : null;
      const trader = traders[b.buyer.toLowerCase()];
      return {
        token: info?.token ?? null,
        name: meta?.name ?? null,
        symbol: meta?.symbol ?? null,
        logo: meta?.logo ?? "",
        buyer: b.buyer,
        buyerName: trader?.displayName ?? null,
        buyerHandle: trader?.handle ?? null,
        buyerAvatar: trader?.avatar ?? null,
        buyerVerified: trader?.verified ?? false,
        amountQuote,
        amountUsd,
        isNative,
        block: Number(b.blockNumber),
        txHash: b.txHash,
      };
    });

    return NextResponse.json({ items, ethUsd: eth });
  } catch (err) {
    const raw = err instanceof Error ? err.message : "";
    const message = /allowlist|HTTP request failed|fetch failed|timeout|network/i.test(raw)
      ? "Couldn't reach Robinhood Chain right now. Try again in a moment."
      : raw || "Failed to load buys.";
    return NextResponse.json({ error: message, items: [] }, { status: 502 });
  }
}
