import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { personaConfigured, personaReply, type PersonaTurn } from "@/lib/ai/persona";
import { getKv } from "@/lib/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/token/{address}/persona
 * Body: { profile: {name, symbol, description?, handle?, source?}, messages: [{role, content}] }
 * Returns one in-character AI reply for that coin's persona.
 *
 * Returns { configured: false } (200) when no AI provider key is set, so the
 * client can hide the persona chat gracefully.
 */
const RL_WINDOW = 60; // seconds
const RL_MAX = 20; // replies per window per token+ip

export async function POST(req: Request, { params }: { params: { address: string } }) {
  const token = params.address ?? "";
  if (!isAddress(token)) {
    return NextResponse.json({ error: "Invalid token address." }, { status: 400 });
  }
  if (!personaConfigured()) {
    return NextResponse.json({ configured: false });
  }

  let body: {
    profile?: { name?: string; symbol?: string; description?: string; handle?: string; source?: string };
    messages?: PersonaTurn[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request body." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
  }
  const symbol = (body.profile?.symbol ?? "").trim();
  const name = (body.profile?.name ?? "").trim();
  if (!name && !symbol) {
    return NextResponse.json({ error: "Missing coin profile." }, { status: 400 });
  }

  // Light rate limit (best-effort; skipped when KV isn't configured).
  const kv = getKv();
  if (kv) {
    try {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "anon";
      const rlKey = `persona:rl:${token.toLowerCase()}:${ip}`;
      const n = await kv.incr(rlKey);
      if (n === 1) await kv.expire(rlKey, RL_WINDOW);
      if (n > RL_MAX) {
        return NextResponse.json({ error: "Slow down a moment and try again." }, { status: 429 });
      }
    } catch {
      // rate limiting is best-effort
    }
  }

  try {
    const reply = await personaReply(
      {
        name,
        symbol,
        description: body.profile?.description,
        handle: body.profile?.handle,
        source: body.profile?.source === "x" ? "x" : "fomo",
      },
      messages,
    );
    return NextResponse.json({ configured: true, reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : "The persona could not reply.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
