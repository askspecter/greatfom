import { NextResponse } from "next/server";
import { generateProfilePackage, type ProfileSeed } from "@/lib/ai/generate";
import { generateTokenImage } from "@/lib/ai/image";
import { checkTickerAvailability } from "@/lib/ai/availability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/generate  { handle, displayName?, bio?, vibe? }
 * → full profile coin package + an avatar (data URI) + on-chain ticker warning.
 */
export async function POST(req: Request) {
  let seed: ProfileSeed = { handle: "" };
  try {
    const body = (await req.json()) as Partial<ProfileSeed>;
    seed = {
      handle: (body.handle ?? "").trim(),
      displayName: body.displayName?.trim() || undefined,
      bio: body.bio?.trim() || undefined,
      vibe: body.vibe?.trim() || undefined,
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (seed.handle.length < 2) {
    return NextResponse.json({ error: "Enter your fomo.family handle (at least 2 characters)." }, { status: 400 });
  }
  if (seed.handle.length > 60) {
    return NextResponse.json({ error: "Handle is too long (max 60 characters)." }, { status: 400 });
  }

  try {
    const pkg = await generateProfilePackage(seed);

    // Avatar: real AI image if a provider is configured, else deterministic SVG.
    const avatarPrompt = pkg.avatarPrompts[0] ?? pkg.description;
    const avatar = await generateTokenImage(pkg.ticker, avatarPrompt, "icon");

    // Ticker collision is a soft warning.
    const availability = await checkTickerAvailability(pkg.ticker);

    return NextResponse.json({ package: pkg, avatar, availability });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to build the profile package.";
    const status = /API_KEY|credits|LLM Gateway|not set|rejected the API key/i.test(message) ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
