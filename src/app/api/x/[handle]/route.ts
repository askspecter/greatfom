import { NextResponse } from "next/server";
import { getKv } from "@/lib/kv";
import { cleanHandle, resolveXProfile, xConfigured, XResolveError, type XProfile } from "@/lib/x/resolve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/x/{handle}
 * Resolve an X handle to its public profile (real name, avatar, bio, verified)
 * via the official X API. Cached in KV to protect the X rate limit.
 *
 * Returns { configured: false } (200) when no X_BEARER_TOKEN is set, so the
 * client can silently fall back to the avatar-only path instead of erroring.
 */
const CACHE_TTL_SECONDS = 60 * 60 * 12; // 12h
const cacheKey = (h: string) => `x:profile:${h.toLowerCase()}`;

export async function GET(_req: Request, { params }: { params: { handle: string } }) {
  const handle = cleanHandle(params.handle ?? "");
  if (handle.length < 1) {
    return NextResponse.json({ error: "Enter an X handle." }, { status: 400 });
  }
  if (!xConfigured()) {
    // Not an error — let the client fall back to avatar-only detection.
    return NextResponse.json({ configured: false });
  }

  const kv = getKv();
  if (kv) {
    try {
      const cached = await kv.get<XProfile>(cacheKey(handle));
      if (cached) return NextResponse.json({ configured: true, profile: cached, cached: true });
    } catch {
      // cache is best-effort; fall through to a live resolve
    }
  }

  try {
    const profile = await resolveXProfile(handle);
    if (kv) {
      try {
        await kv.set(cacheKey(handle), profile, { ex: CACHE_TTL_SECONDS });
      } catch {
        // ignore cache write failures
      }
    }
    return NextResponse.json({ configured: true, profile, cached: false });
  } catch (err) {
    if (err instanceof XResolveError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to resolve the X profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
