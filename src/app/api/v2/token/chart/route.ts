import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { getKv } from "@/lib/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/v2/token/chart?address=0x...
 * The market-cap time series for a token, built from lightweight samples the
 * token endpoint records on each read (KV). No on-chain event scan, so it is
 * fast and never rate-limited; the series fills in as the token is viewed and
 * traded.
 */
const chartKey = (t: string) => `chart:v2:${t.toLowerCase()}`;

interface Sample {
  t: number;
  mc: number;
  p: number | null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  if (!address || !isAddress(address)) {
    return NextResponse.json({ points: [] }, { status: 400 });
  }

  const kv = getKv();
  if (!kv) return NextResponse.json({ points: [] });

  try {
    const raw = (await kv.lrange<Sample | string>(chartKey(address), 0, 999)) ?? [];
    const points = raw
      .map((r) => (typeof r === "string" ? safeParse(r) : r))
      .filter((p): p is Sample => !!p && typeof p.t === "number" && typeof p.mc === "number")
      .sort((a, b) => a.t - b.t); // oldest to newest
    return NextResponse.json({ points });
  } catch {
    return NextResponse.json({ points: [] });
  }
}

function safeParse(s: string): Sample | null {
  try {
    return JSON.parse(s) as Sample;
  } catch {
    return null;
  }
}
