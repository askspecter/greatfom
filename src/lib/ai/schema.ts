import { z } from "zod";

/** Quote assets the AI may recommend for a v2 profile launch. */
export const quoteAssetSchema = z.enum(["ETH", "USDG", "NVDA", "AAPL", "HOOD"]);

/**
 * The structured PROFILE token package the model must return. This is the
 * profile-coin equivalent of a launch package: it turns a fomo.family profile
 * into a name/ticker/bio/announcement suitable for a Pons v2 launch.
 */
export const profilePackageSchema = z.object({
  name: z.string().min(1).max(40),
  ticker: z
    .string()
    .min(2)
    .max(10)
    .transform((s) => s.toUpperCase().replace(/[^A-Z0-9]/g, "")),
  // One-line hook shown on the profile card and written on-chain.
  description: z.string().min(1).max(280),
  // Longer profile bio / backstory.
  bio: z.string().min(1).max(1200),
  // Short vibe tags describing the profile (e.g. "degen", "builder", "artist").
  vibes: z.array(z.string().min(1)).min(2).max(6),
  // Ready-to-post X launch thread announcing the profile coin.
  xThread: z.array(z.string().min(1)).min(3).max(6),
  // Image-gen prompts for the profile avatar.
  avatarPrompts: z.array(z.string().min(1)).min(1).max(3),
  recommendation: z.object({
    quoteAsset: quoteAssetSchema,
    rationale: z.string().min(1).max(400),
  }),
});

export type ProfilePackage = z.infer<typeof profilePackageSchema>;

/** JSON Schema handed to Claude as a tool so output is well-formed. */
export const profilePackageJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["name", "ticker", "description", "bio", "vibes", "xThread", "avatarPrompts", "recommendation"],
  properties: {
    name: { type: "string", description: "Profile token name, usually the person's display name, max 40 chars" },
    ticker: { type: "string", description: "2-10 chars, UPPERCASE letters/numbers, derived from the handle" },
    description: { type: "string", description: "One-line hook about the profile, max 280 chars" },
    bio: { type: "string", description: "The profile bio/backstory, 2-4 short paragraphs" },
    vibes: {
      type: "array",
      minItems: 2,
      maxItems: 6,
      items: { type: "string" },
      description: "Short vibe/personality tags for the profile",
    },
    xThread: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: { type: "string" },
      description: "Ready-to-post X/Twitter thread announcing the profile coin, <=280 chars each",
    },
    avatarPrompts: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: { type: "string" },
      description: "Image-gen prompts for the profile avatar art",
    },
    recommendation: {
      type: "object",
      additionalProperties: false,
      required: ["quoteAsset", "rationale"],
      properties: {
        quoteAsset: { type: "string", enum: ["ETH", "USDG", "NVDA", "AAPL", "HOOD"] },
        rationale: { type: "string", description: "Why this quote asset fits the profile, max 400 chars" },
      },
    },
  },
} as const;
