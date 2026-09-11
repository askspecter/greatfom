/** Shared site constants (links, copy). */
export const SITE = {
  name: "Kore",
  shortName: "Kore",
  tagline: "Coined your fomo profile.",
  description:
    "Turn your fomo.family profile into a token. Kore drafts your profile coin and launches it on the Pons bonding curve on Robinhood Chain, non-custodial. Your wallet signs every transaction.",
  x: "https://x.com/korefamily",
  xHandle: "@korefamily",
  company: "Kore",
  chain: "Robinhood Chain",
  poweredBy: "Pons",
  ponsUrl: "https://ponsfamily.com",
  fomoUrl: "https://fomo.family",
} as const;

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/create", label: "Launch" },
  { href: "/profile", label: "Profile" },
] as const;
