/**
 * ETH/USD spot price for denominating market caps in USD. Cached in-process for
 * a minute; on any failure we return the last value we saw (or null), so a
 * flaky price feed never breaks a page. Runs server-side only.
 */
let cache: { usd: number; at: number } | null = null;

export async function ethUsd(): Promise<number | null> {
  if (cache && Date.now() - cache.at < 60_000) return cache.usd;
  try {
    const res = await fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot", {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { data?: { amount?: string } };
    const usd = Number(data?.data?.amount);
    if (Number.isFinite(usd) && usd > 0) {
      cache = { usd, at: Date.now() };
      return usd;
    }
  } catch {
    // fall through to last-known
  }
  return cache?.usd ?? null;
}
