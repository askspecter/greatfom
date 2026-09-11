import { NextResponse } from "next/server";
import { isAddress, type Address } from "viem";
import { explorerUrl } from "@/lib/chain";
import { SITE } from "@/lib/site";
import { getKv } from "@/lib/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/kore/holders?token=0x..
 * Real holder stats for a token, read from the Blockscout explorer:
 * holder count, 24h transfer volume (when the explorer exposes it) and the
 * top holders (address + balance + % of supply). Defaults to $KORE.
 *
 * Best-effort and KV-cached: if the explorer is unreachable or rate-limited,
 * returns nulls/empty so the dashboard degrades gracefully instead of erroring.
 */
const TTL = 60;
const DEAD = "0x000000000000000000000000000000000000dead";
const ZERO = "0x0000000000000000000000000000000000000000";

interface Holder {
  address: string;
  value: number;
  pct: number;
  isBurn: boolean;
}

async function j(url: string): Promise<Record<string, unknown> | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12_000);
    const res = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store", signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) return null; // Cloudflare challenge page, etc.
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get("token") ?? SITE.koreToken).trim();
  if (!isAddress(raw)) return NextResponse.json({ error: "Bad token address." }, { status: 400 });
  const token = (raw as Address).toLowerCase();

  const kv = getKv();
  const key = `holders:${token}`;
  if (kv) {
    try {
      const hit = await kv.get(key);
      if (hit) return NextResponse.json(hit);
    } catch {}
  }

  const base = explorerUrl.replace(/\/+$/, "");
  const info = await j(`${base}/api/v2/tokens/${token}`);
  const holdersRaw = await j(`${base}/api/v2/tokens/${token}/holders?limit=25`);

  const decimals = Number(info?.decimals ?? 18) || 18;
  const supplyRaw = typeof info?.total_supply === "string" ? Number(info.total_supply) : null;
  const supply = supplyRaw != null ? supplyRaw / 10 ** decimals : null;
  const holdersCount =
    typeof info?.holders === "string" ? Number(info.holders) : typeof info?.holders_count === "string" ? Number(info.holders_count) : null;
  const volume24h = typeof info?.volume_24h === "string" ? Number(info.volume_24h) : null;

  const items = Array.isArray(holdersRaw?.items) ? (holdersRaw!.items as Record<string, unknown>[]) : [];
  const top: Holder[] = items
    .map((it) => {
      const addr = String(((it.address as Record<string, unknown>)?.hash as string) ?? it.address ?? "").toLowerCase();
      const value = Number(it.value ?? 0) / 10 ** decimals;
      const pct = supply && supply > 0 ? (value / supply) * 100 : 0;
      const isBurn = addr === DEAD || addr === ZERO;
      return { address: addr, value, pct, isBurn };
    })
    .filter((h) => h.address);

  const payload = {
    token,
    holdersCount,
    supply,
    volume24h,
    top,
    source: info || holdersRaw ? "blockscout" : "unavailable",
  };

  if (kv && (info || holdersRaw)) {
    try {
      await kv.set(key, payload, { ex: TTL });
    } catch {}
  }
  return NextResponse.json(payload);
}
