import { NextResponse } from "next/server";
import { isAddress, parseAbi, type Address } from "viem";
import { ponsClient } from "@/lib/pons/reader";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/kore/wallet?token=0x..&address=0x..
 * A holder's real, on-chain position in a token: current balance and share of
 * supply. Also reports payout status. ETH payouts to holders are not live yet,
 * so ethReceived is always 0 and payoutsLive is false — we never fabricate a
 * payout figure. When payouts ship, this route returns each wallet's real
 * distributed ETH.
 */
const erc20 = parseAbi([
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawToken = (searchParams.get("token") ?? SITE.koreToken).trim();
  const rawWallet = (searchParams.get("address") ?? "").trim();
  if (!isAddress(rawToken)) return NextResponse.json({ error: "Bad token address." }, { status: 400 });
  if (!isAddress(rawWallet)) return NextResponse.json({ error: "Enter a valid wallet address." }, { status: 400 });

  const token = rawToken as Address;
  const wallet = rawWallet as Address;

  try {
    const client = ponsClient();
    const [supplyRaw, balRaw, decRaw] = await Promise.all([
      client.readContract({ address: token, abi: erc20, functionName: "totalSupply" }) as Promise<bigint>,
      client.readContract({ address: token, abi: erc20, functionName: "balanceOf", args: [wallet] }) as Promise<bigint>,
      client.readContract({ address: token, abi: erc20, functionName: "decimals" }).catch(() => 18) as Promise<number>,
    ]);
    const decimals = Number(decRaw) || 18;
    const supply = Number(supplyRaw) / 10 ** decimals;
    const balance = Number(balRaw) / 10 ** decimals;
    const share = supply > 0 ? (balance / supply) * 100 : 0;

    return NextResponse.json({
      token: token.toLowerCase(),
      wallet: wallet.toLowerCase(),
      balance,
      supply,
      share,
      isHolder: balance > 0,
      // Payouts are not live yet — always real, never fabricated.
      payoutsLive: false,
      ethReceived: 0,
      payoutRounds: 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to read the wallet position.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
