import { NextResponse } from "next/server";
import { isAddress, parseAbiItem, parseAbi, type Address } from "viem";
import { ponsClient } from "@/lib/pons/reader";
import { SITE } from "@/lib/site";
import { getKv } from "@/lib/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/kore/holders?token=0x..
 * Real holder stats for a token, computed straight from on-chain Transfer logs
 * via RPC (the Blockscout explorer sits behind a bot wall and is unreliable
 * server-side). Returns holder count, total supply, and the top holders
 * (address + balance + % of supply). Defaults to $KORE. KV-cached.
 */
const TTL = 180;
const DEAD = "0x000000000000000000000000000000000000dead";
const ZERO = "0x0000000000000000000000000000000000000000";
const TRANSFER = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)");
const erc20 = parseAbi(["function totalSupply() view returns (uint256)", "function decimals() view returns (uint8)"]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get("token") ?? SITE.koreToken).trim();
  if (!isAddress(raw)) return NextResponse.json({ error: "Bad token address." }, { status: 400 });
  const token = (raw as Address).toLowerCase();

  const kv = getKv();
  const key = `holders:v2:${token}`;
  if (kv) {
    try {
      const hit = await kv.get(key);
      if (hit) return NextResponse.json(hit);
    } catch {}
  }

  try {
    const client = ponsClient();
    const [decRaw, supplyRaw, logs] = await Promise.all([
      client.readContract({ address: token as Address, abi: erc20, functionName: "decimals" }).catch(() => 18) as Promise<number>,
      client.readContract({ address: token as Address, abi: erc20, functionName: "totalSupply" }).catch(() => 0n) as Promise<bigint>,
      client.getLogs({ address: token as Address, event: TRANSFER, fromBlock: 0n, toBlock: "latest" }),
    ]);
    const decimals = Number(decRaw) || 18;
    const denom = 10 ** decimals;

    // Tally net balance per address from the full transfer history.
    const bal = new Map<string, bigint>();
    for (const l of logs) {
      const from = (l.args.from ?? ZERO).toLowerCase();
      const to = (l.args.to ?? ZERO).toLowerCase();
      const v = (l.args.value ?? 0n) as bigint;
      if (from !== ZERO) bal.set(from, (bal.get(from) ?? 0n) - v);
      bal.set(to, (bal.get(to) ?? 0n) + v);
    }

    const supply = supplyRaw > 0n ? Number(supplyRaw) / denom : null;
    const entries = [...bal.entries()].filter(([a, v]) => v > 0n && a !== ZERO);
    // Real holders exclude the burn sinks (dead / zero).
    const holdersCount = entries.filter(([a]) => a !== DEAD).length;

    const top = entries
      .sort((a, b) => (b[1] > a[1] ? 1 : b[1] < a[1] ? -1 : 0))
      .slice(0, 25)
      .map(([address, vRaw]) => {
        const value = Number(vRaw) / denom;
        const pct = supply && supply > 0 ? (value / supply) * 100 : 0;
        return { address, value, pct, isBurn: address === DEAD || address === ZERO };
      });

    const payload = { token, holdersCount, supply, volume24h: null, top, source: "onchain" };
    if (kv) {
      try {
        await kv.set(key, payload, { ex: TTL });
      } catch {}
    }
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to read holders on-chain.";
    return NextResponse.json({ token, holdersCount: null, supply: null, volume24h: null, top: [], source: "unavailable", error: message });
  }
}
