/**
 * Resolve a token/profile image reference into a URL a browser can load.
 * On-chain logos are often ipfs:// (or ar://) which <img> can't fetch directly,
 * so route those through a public gateway. Passes data: and https: through.
 */
export function resolveLogo(logo?: string | null): string {
  if (!logo) return "";
  const s = logo.trim();
  if (!s) return "";
  if (s.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${s.slice(7).replace(/^ipfs\//, "")}`;
  if (s.startsWith("ar://")) return `https://arweave.net/${s.slice(5)}`;
  return s;
}

/**
 * Deterministic aurora gradient derived from a seed (address, symbol, handle),
 * used as a clean fallback avatar/logo when no image is available.
 */
export function gradientFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const a = h % 360;
  const b = (a + 70 + ((h >> 8) % 110)) % 360;
  return `linear-gradient(135deg, hsl(${a} 78% 62%), hsl(${b} 80% 58%))`;
}
