import { NextResponse } from "next/server";
import { isAddress, parseAbi, type Address } from "viem";
import { ponsClient } from "@/lib/pons/reader";
import { SITE } from "@/lib/site";
import { getKv } from "@/lib/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/kore/burned?token=0x..
 * Live burned amount for a token: the balance held at the standard burn
 * addresses (dead + zero), read on-chain, plus total supply and % burned.
 * Defaults to the official $KORE token. Best-effort, KV-cached briefly.
 */
const erc20 = parseAbi([
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
]);

const DEAD = "0x000000000000000000000000000000000000dEaD" as Address;
const ZERO = "0x0000000000000000000000000000000000000000" as Address;
const TTL = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get("token") ?? SITE.koreToken).trim();
  if (!isAddress(raw)) return NextResponse.json({ error: "Bad token address." }, { status: 400 });
  const token = raw as Address;

  const kv = getKv();
  const key = `burned:${token.toLowerCase()}`;
  if (kv) {
    try {
      const hit = await kv.get(key);
      if (hit) return NextResponse.json(hit);
    } catch {}
  }

  try {
    const client = ponsClient();
    const [supplyRaw, deadRaw, zeroRaw] = await Promise.all([
      client.readContract({ address: token, abi: erc20, functionName: "totalSupply" }) as Promise<bigint>,
      client.readContract({ address: token, abi: erc20, functionName: "balanceOf", args: [DEAD] }) as Promise<bigint>,
      client.readContract({ address: token, abi: erc20, functionName: "balanceOf", args: [ZERO] }) as Promise<bigint>,
    ]);
    const supply = Number(supplyRaw) / 1e18;
    const burned = (Number(deadRaw) + Number(zeroRaw)) / 1e18;
    // Burns to dead/zero don't reduce totalSupply, so % is against the mint.
    const pct = supply > 0 ? (burned / supply) * 100 : 0;
    const payload = { token: token.toLowerCase(), burned, supply, pct };

    if (kv) {
      try {
        await kv.set(key, payload, { ex: TTL });
      } catch {}
    }
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to read burned amount.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
