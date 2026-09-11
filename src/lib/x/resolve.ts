/**
 * ─────────────────────────────────────────────────────────────────────────
 *  X (Twitter) profile resolution (server-side only).
 *
 *  Resolves an X handle to its public profile — real display name, avatar,
 *  bio and the blue verification flag — via the official X API v2
 *  (GET /2/users/by/username/:username). This lets someone coin their X
 *  profile with their real name + verified badge, not just the handle.
 *
 *  Requires a server-side X_BEARER_TOKEN (App-only Bearer). The token never
 *  reaches the browser — only this module and the /api/x route read it.
 *  When it isn't set, xConfigured() returns false and the client falls back
 *  to an avatar-only path (unavatar), so the feature degrades gracefully.
 * ─────────────────────────────────────────────────────────────────────────
 */

const BASE_URL = "https://api.twitter.com";

export interface XProfile {
  /** Canonical handle (without @). */
  handle: string;
  /** Real display name, or the handle when none is set. */
  displayName: string;
  /** Profile bio / description (may be empty). */
  bio: string;
  /** Profile picture URL, upgraded to the full-size image (may be empty). */
  avatar: string;
  /** Blue / verified flag from X. */
  verified: boolean;
  /** Verification type (blue, business, government) when present. */
  verifiedType: string | null;
  followers: number | null;
}

/** A resolution error with an HTTP-ish status so the route can map it cleanly. */
export class XResolveError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "XResolveError";
  }
}

/** Whether X resolution is even possible (a bearer token is configured). */
export function xConfigured(): boolean {
  return Boolean(process.env.X_BEARER_TOKEN?.trim());
}

/** Strip a leading @ and surrounding whitespace. X handles are case-insensitive. */
export function cleanHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "");
}

/** X handles are 1–15 chars, letters/digits/underscore only. */
function validHandle(h: string): boolean {
  return /^[A-Za-z0-9_]{1,15}$/.test(h);
}

/** X returns a `_normal` (48px) avatar by default — upgrade to the full image. */
function fullSizeAvatar(url: string): string {
  return url.replace(/_normal(\.\w+)(\?.*)?$/, "$1$2");
}

/**
 * Resolve an X handle to its public profile via the X API v2.
 * Throws XResolveError for missing token (503), bad handle (400),
 * unknown handle (404), bad token (401) and rate limits (429).
 */
export async function resolveXProfile(rawHandle: string): Promise<XProfile> {
  const token = process.env.X_BEARER_TOKEN?.trim();
  if (!token) {
    throw new XResolveError(
      "X detection is not configured on the server (set X_BEARER_TOKEN).",
      503,
    );
  }

  const handle = cleanHandle(rawHandle);
  if (!validHandle(handle)) {
    throw new XResolveError("Enter a valid X handle (letters, digits, underscore).", 400);
  }

  const fields = "profile_image_url,verified,verified_type,description,name,public_metrics";
  const url = `${BASE_URL}/2/users/by/username/${encodeURIComponent(handle)}?user.fields=${fields}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { authorization: `Bearer ${token}`, accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
  } catch {
    throw new XResolveError("Couldn't reach the X API. Try again.", 502);
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 401) throw new XResolveError("The X API token is invalid.", 401);
  if (res.status === 429) throw new XResolveError("X API rate limit reached. Try later.", 429);
  if (!res.ok && res.status !== 404) throw new XResolveError(`X API error (${res.status}).`, 502);

  const json = (await res.json()) as {
    data?: {
      username?: string;
      name?: string;
      description?: string;
      profile_image_url?: string;
      verified?: boolean;
      verified_type?: string;
      public_metrics?: { followers_count?: number };
    };
  };

  const d = json.data;
  if (!d?.username) {
    throw new XResolveError(`No X profile found for @${handle}.`, 404);
  }

  return {
    handle: d.username,
    displayName: (d.name && d.name.trim()) || d.username,
    bio: typeof d.description === "string" ? d.description : "",
    avatar: d.profile_image_url ? fullSizeAvatar(d.profile_image_url) : "",
    verified: d.verified === true,
    verifiedType:
      typeof d.verified_type === "string" && d.verified_type !== "none" ? d.verified_type : null,
    followers:
      typeof d.public_metrics?.followers_count === "number" ? d.public_metrics.followers_count : null,
  };
}
