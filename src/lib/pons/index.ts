import { PonsV2Adapter } from "./v2";
import type { LaunchStrategy } from "./strategy";
import type { PonsVersion, VersionInfo } from "./types";

/**
 * Dime launches only on Pons. The strategy indirection is kept so
 * the UI, wallet layer and indexer never hardcode the write path — they ask the
 * active strategy to prepare the launch.
 */
const strategies: Record<PonsVersion, LaunchStrategy> = {
  v2: new PonsV2Adapter(),
};

/** Return the v2 launch adapter. */
export function getStrategy(version: PonsVersion = "v2"): LaunchStrategy {
  return strategies[version];
}

/** Info card for the v2 launch model. */
export function versionInfo(): VersionInfo {
  return strategies.v2.info();
}

export * from "./types";
export {
  REGISTRY,
  PONS_V2,
  isVersionWired,
  isVersionDeployable,
  V2_GRADUATION_THRESHOLD_ETH,
} from "./registry";
