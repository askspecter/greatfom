import type AnthropicSDK from "@anthropic-ai/sdk";
import { profilePackageSchema, type ProfilePackage } from "./schema";

/**
 * Dime's profile-package generator.
 *
 * Turns a fomo.family profile (handle + optional display name / bio / vibe)
 * into a launch-ready PROFILE token package for Pons v2.
 *
 * Primary provider is the **Bankr LLM Gateway** (OpenAI-compatible
 * /v1/chat/completions at https://llm.bankr.bot). Anthropic (direct) stays as
 * an optional fallback. Output is JSON-mode + zod-validated (with one repair
 * retry) so it stays reliable across whichever model Bankr routes to.
 */

export interface ProfileSeed {
  handle: string;
  displayName?: string;
  bio?: string;
  vibe?: string;
}

const CREATIVE_RULES = `You are the creative engine of Dime, an app that tokenizes a person's fomo.family profile and launches it on the Pons bonding curve (Robinhood Chain).
Given a fomo.family profile, design a COMPLETE, launch-ready PROFILE COIN package for that person.

- name: the profile coin name — usually the person's display name or handle, catchy and human. Max 40 chars.
- ticker: 2-10 UPPERCASE chars derived from the handle (e.g. handle "brian.fomo" -> "BRIAN"). No spaces.
- description: one punchy one-line hook that captures who this profile is.
- bio: a short, fun profile bio/backstory (2-4 short paragraphs) that gives the profile identity. Write in third or first person, keep it flattering but grounded.
- vibes: 2-6 short personality/vibe tags (e.g. "builder", "degen", "artist", "shitposter").
- xThread: a ready-to-post X thread announcing this person's profile coin; each entry <=280 chars, native crypto-Twitter voice, tasteful emoji.
- avatarPrompts: 1-3 vivid image-generation prompts for the profile avatar (a clean, iconic character/portrait style).
- recommendation: pick the v2 quote asset that best fits the profile:
    * ETH   = the default fair-launch pairing; use it unless the profile clearly maps to an RWA theme.
    * USDG/NVDA/AAPL/HOOD = RWA pairs; use when the person's identity maps to markets/stocks/finance.
  Explain the choice briefly in rationale.
- Write ALL copy in English. Keep ticker ASCII. Never promise financial returns or guaranteed price action.
- Never use em-dashes or en-dashes (U+2014 / U+2013). Use commas, periods, or plain hyphens instead.
- This is a real person's profile; be respectful, never defamatory, never claim private facts you were not given.`;

const JSON_SPEC = `Respond with ONLY a single JSON object (no markdown, no code fences, no prose) with EXACTLY these keys:
{
  "name": string,                // <= 40 chars
  "ticker": string,              // 2-10 uppercase A-Z/0-9
  "description": string,         // <= 280 chars
  "bio": string,                 // <= 1200 chars
  "vibes": string[],             // 2-6 items
  "xThread": string[],           // 3-6 items, each <= 280 chars
  "avatarPrompts": string[],     // 1-3 items
  "recommendation": {
    "quoteAsset": "ETH" | "USDG" | "NVDA" | "AAPL" | "HOOD",
    "rationale": string          // <= 400 chars
  }
}`;

type Provider = "bankr" | "anthropic";

function pickProvider(): Provider {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();
  if (explicit === "bankr" || explicit === "anthropic") return explicit;
  if (process.env.BANKR_API_KEY) return "bankr";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "bankr"; // default target; surfaces a clear "not configured" error below
}

function describeProfile(seed: ProfileSeed): string {
  const lines = [`fomo.family handle: ${seed.handle}`];
  if (seed.displayName?.trim()) lines.push(`Display name: ${seed.displayName.trim()}`);
  if (seed.bio?.trim()) lines.push(`Profile bio: ${seed.bio.trim()}`);
  if (seed.vibe?.trim()) lines.push(`Vibe / notes: ${seed.vibe.trim()}`);
  return lines.join("\n");
}

export async function generateProfilePackage(seed: ProfileSeed): Promise<ProfilePackage> {
  const provider = pickProvider();
  const profile = describeProfile(seed);
  const obj = provider === "bankr" ? await callBankr(profile) : await callAnthropic(profile);
  return profilePackageSchema.parse(obj);
}

/* ── Bankr LLM Gateway (OpenAI-compatible) ───────────────────────────────── */

async function callBankr(profile: string): Promise<unknown> {
  const key = process.env.BANKR_API_KEY;
  if (!key) {
    throw new Error("BANKR_API_KEY is not set. Create a key with LLM Gateway enabled at bankr.bot/api-keys.");
  }
  const base = process.env.BANKR_BASE_URL || "https://llm.bankr.bot";
  const model = process.env.BANKR_MODEL || "claude-sonnet-5";

  const body = {
    model,
    max_tokens: 2000,
    temperature: 0.9,
    messages: [
      { role: "system", content: `${CREATIVE_RULES}\n\n${JSON_SPEC}` },
      { role: "user", content: `Profile:\n${profile}` },
    ],
  };

  const first = await bankrChat(base, key, body);
  try {
    return extractJson(first);
  } catch {
    const repair = await bankrChat(base, key, {
      ...body,
      temperature: 0.2,
      messages: [
        { role: "system", content: JSON_SPEC },
        { role: "user", content: `Return valid JSON only for this profile:\n${profile}` },
        { role: "assistant", content: first },
        { role: "user", content: "That was not valid JSON. Reply with ONLY the JSON object." },
      ],
    });
    return extractJson(repair);
  }
}

async function bankrChat(base: string, key: string, body: unknown): Promise<string> {
  const res = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", "X-API-Key": key },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 402 || /credit/i.test(text)) {
      throw new Error("Bankr LLM credits exhausted - top up at bankr.bot (bankr llm credits add).");
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error("Bankr rejected the API key - ensure LLM Gateway is enabled for it.");
    }
    throw new Error(`Bankr LLM Gateway error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Bankr returned an empty completion.");
  return content;
}

/* ── Anthropic direct (fallback), structured via tool-use ────────────────── */

async function callAnthropic(profile: string): Promise<unknown> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set on the server.");

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const { profilePackageJsonSchema } = await import("./schema");
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

  const message = await client.messages.create({
    model,
    max_tokens: 2000,
    system: CREATIVE_RULES,
    tools: [
      {
        name: "emit_profile_package",
        description: "Emit the complete, structured profile coin package.",
        input_schema: profilePackageJsonSchema as unknown as AnthropicSDK.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: "emit_profile_package" },
    messages: [{ role: "user", content: `Profile:\n${profile}` }],
  });

  const toolUse = message.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("The model did not return a profile package.");
  }
  return toolUse.input;
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

/** Pull a JSON object out of a model reply, tolerating code fences / prose. */
function extractJson(text: string): unknown {
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  if (!s.startsWith("{")) {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start !== -1 && end !== -1) s = s.slice(start, end + 1);
  }
  return JSON.parse(s);
}
