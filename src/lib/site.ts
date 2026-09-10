/** Shared site constants (links, copy). */
export const SITE = {
  name: "Dime",
  shortName: "Dime",
  tagline: "Tokenize your fomo.family profile.",
  description:
    "Turn your fomo.family profile into a token. Dime drafts your profile coin and launches it on the Pons bonding curve on Robinhood Chain, non-custodial. Your wallet signs every transaction.",
  x: "https://x.com/dimedotfamily",
  xHandle: "@dimedotfamily",
  company: "Dime",
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
