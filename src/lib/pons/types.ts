/**
 * Dime uses a single Pons launch model: every profile launches on the Pons
 * bonding curve. The version type is kept (as a fixed literal) so records and
 * the engine share one vocabulary with Pons, but there is no v1 path here.
 */
export type PonsVersion = "v2";

/**
 * Quote assets a v2 profile can be paired against. Native ETH is the default;
 * the RWA pairs are offered only after the factory validates them on-chain
 * (see readerV2.usableQuoteAssets), so this union is advisory for the AI.
 */
export type QuoteAsset = "ETH" | "USDG" | "NVDA" | "AAPL" | "HOOD";

export const V2_QUOTE_ASSETS: QuoteAsset[] = ["ETH", "USDG", "NVDA", "AAPL", "HOOD"];

/** The user-facing form that feeds a profile launch. */
export interface LaunchInput {
  version: PonsVersion;
  /** Profile token name (usually the person's display name). */
  name: string;
  /** Ticker, derived from the fomo.family handle. */
  ticker: string;
  description: string;
  imageUri: string; // data: URI or hosted URL (the profile avatar)
  /**
   * On-chain recipient of this profile's creator fees. Set to the fomo.family
   * profile's resolved EVM wallet so fees route to that person; when unset the
   * adapter falls back to the connected (deploying) wallet.
   */
  creatorFeeRecipient?: `0x${string}`;
  quoteAsset: QuoteAsset;
  /** Optional initial dev buy, in ETH. */
  initialBuyEth?: string;
  /** Quote/pair token address; zero address = native ETH. */
  pairToken?: `0x${string}`;
  /** Which on-chain launch config id to use. Default 0. */
  launchConfigId?: number;
  /** Enable protocol buybacks for this launch. */
  buybackEnabled?: boolean;
  // Social links, written into the token's on-chain metadata.
  twitter?: string;
  telegram?: string;
  website?: string;
}

/**
 * An executable launch plan the adapter hands back. Executed via wallet
 * writeContract so the wallet shows a rich, decoded confirmation.
 */
export interface LaunchPlan {
  address: `0x${string}`;
  abi: unknown; // viem Abi; kept loose to avoid a hard viem dep in this file.
  functionName: string;
  args: readonly unknown[];
  value: bigint;
  summary: string;
  warnings: string[];
}

/** What the adapter reports about the launch model before deploy. */
export interface VersionInfo {
  version: PonsVersion;
  label: string;
  liquidity: string;
  quoteAssets: QuoteAsset[];
  graduation: string | null;
  /** false when the registry has no factory wired → deploy disabled. */
  ready: boolean;
  note: string;
}
