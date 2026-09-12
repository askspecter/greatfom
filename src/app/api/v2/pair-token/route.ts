import { NextResponse } from "next/server";
import { getAddress, isAddress, parseAbi, zeroAddress, type Address } from "viem";
import { ponsClient } from "@/lib/pons/reader";
import { PONS_V2 } from "@/lib/pons/registry";
import { v2FactoryAbi } from "@/lib/pons/abisV2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v2/pair-token?address=0x..
 * Resolve any Robinhood Chain ERC-20 the user pastes as a candidate paired
 * asset: read its real name/symbol/decimals on-chain, and check whether the
 * Pons factory approves it as a pair token (a launch against an unapproved
 * token would revert). Returns { symbol, name, decimals, approved, ... } so the
 * paired-asset picker can add it or explain why it can't be used yet.
 */
const erc20 = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get("address") ?? "").trim();
  if (!isAddress(raw)) return NextResponse.json({ error: "Enter a valid token address (0x…)." }, { status: 400 });
  if (raw.toLowerCase() === zeroAddress) return NextResponse.json({ error: "That is the native ETH address." }, { status: 400 });

  const token = getAddress(raw) as Address;

  try {
    const client = ponsClient();
    const [name, symbol, decimals, approved, economics] = await Promise.all([
      client.readContract({ address: token, abi: erc20, functionName: "name" }).catch(() => "") as Promise<string>,
      client.readContract({ address: token, abi: erc20, functionName: "symbol" }).catch(() => "") as Promise<string>,
      client.readContract({ address: token, abi: erc20, functionName: "decimals" }).catch(() => 18) as Promise<number>,
      client
        .readContract({ address: PONS_V2.factory, abi: v2FactoryAbi, functionName: "approvedPairTokens", args: [token] })
        .catch(() => false) as Promise<boolean>,
      client
        .readContract({ address: PONS_V2.factory, abi: v2FactoryAbi, functionName: "pairTokenEconomics", args: [token] })
        .catch(() => [0n, 0n, 18] as [bigint, bigint, number]) as Promise<[bigint, bigint, number]>,
    ]);

    if (!symbol && !name) {
      return NextResponse.json({ error: "That address is not an ERC-20 token on Robinhood Chain." }, { status: 404 });
    }

    const [phantomQuote, graduationThreshold] = economics;
    const usable = Boolean(approved) && phantomQuote > 0n && graduationThreshold > 0n;

    return NextResponse.json({
      address: token,
      symbol: (symbol || name || token.slice(0, 6)).toString().slice(0, 16),
      name: (name || symbol || "Token").toString().slice(0, 40),
      decimals: Number(decimals) || 18,
      approved: usable,
      graduationThreshold: graduationThreshold.toString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn’t read that token.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
