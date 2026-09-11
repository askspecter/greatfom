/** Shared site constants (links, copy). */
export const SITE = {
  name: "Kore",
  shortName: "Kore",
  tagline: "Coined your fomo profile.",
  description:
    "Turn your fomo.family profile into a token. Kore drafts your profile coin and launches it on the Pons bonding curve on Robinhood Chain, non-custodial. Your wallet signs every transaction.",
  x: "https://x.com/koredotfamily",
  xHandle: "@koredotfamily",
  company: "Kore",
  chain: "Robinhood Chain",
  poweredBy: "Pons",
  ponsUrl: "https://ponsfamily.com",
  fomoUrl: "https://fomo.family",
  /** Official $KORE token (live on the Pons bonding curve). */
  koreToken: "0x766c2CFDdC1517320afd2cB46e7Be31f31aB1268",
  koreSymbol: "KORE",
} as const;

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/activity", label: "Buys" },
  { href: "/explore", label: "Explore" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/create", label: "Launch" },
  { href: "/profile", label: "Profile" },
] as const;
