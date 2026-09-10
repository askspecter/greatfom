import { NextResponse } from "next/server";
import { getKv } from "@/lib/kv";
import {
  cleanHandle,
  fomoConfigured,
  resolveFomoProfile,
  FomoResolveError,
  type FomoProfile,
} from "@/lib/fomo/resolve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/fomo/{handle}
 * Resolve a fomo.family handle to its public profile + real wallets. The
 * resolved EVM wallet becomes the creator-fee recipient at launch.
 *
 * Results are cached in KV (when configured) because the FOMO free tier meters
 * handle→wallet resolution separately (25/month) — one cache hit costs nothing.
 */
const CACHE_TTL_SECONDS = 60 * 60 * 12; // 12h
const cacheKey = (h: string) => `fomo:profile:${h.toLowerCase()}`;

export async function GET(_req: Request, { params }: { params: { handle: string } }) {
  const handle = cleanHandle(params.handle ?? "");
  if (handle.length < 2) {
    return NextResponse.json({ error: "Enter a fomo.family handle." }, { status: 400 });
  }
  if (!fomoConfigured()) {
    return NextResponse.json(
      { error: "Profile detection is not configured on the server." },
      { status: 503 },
    );
  }

  const kv = getKv();

  // Serve from cache first (protects the monthly resolution quota).
  if (kv) {
    try {
      const cached = await kv.get<FomoProfile>(cacheKey(handle));
      if (cached) return NextResponse.json({ profile: cached, cached: true });
    } catch {
      // cache is best-effort; fall through to a live resolve
    }
  }

  try {
    const profile = await resolveFomoProfile(handle);
    if (kv) {
      try {
        await kv.set(cacheKey(handle), profile, { ex: CACHE_TTL_SECONDS });
      } catch {
        // ignore cache write failures
      }
    }
    return NextResponse.json({ profile, cached: false });
  } catch (err) {
    if (err instanceof FomoResolveError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to resolve the profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
