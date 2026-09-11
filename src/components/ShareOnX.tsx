"use client";

import { SITE } from "@/lib/site";

/**
 * "Share on X" — opens the X (Twitter) compose intent pre-filled with the
 * coin's name, ticker and a link back to its Kore page, so a creator can post
 * it to their own X profile in one tap.
 */
export function ShareOnX({
  name,
  symbol,
  token,
  handle,
  className = "",
  label = "Share on X",
}: {
  name: string;
  symbol: string;
  token: string;
  handle?: string;
  className?: string;
  label?: string;
}) {
  function share() {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://kore.family";
    const url = `${origin}/launch/${token}`;
    const who = handle ? ` (@${handle.replace(/^@/, "")})` : "";
    const text = `I just coined my fomo profile${who} on Kore.\n\n$${symbol} — ${name} is live on ${SITE.poweredBy}. Trade it here:`;
    const intent =
      `https://x.com/intent/tweet?text=${encodeURIComponent(text)}` +
      `&url=${encodeURIComponent(url)}` +
      `&via=${encodeURIComponent(SITE.xHandle.replace(/^@/, ""))}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  }

  return (
    <button type="button" onClick={share} className={className}>
      <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-current">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
      </svg>
      {label}
    </button>
  );
}
