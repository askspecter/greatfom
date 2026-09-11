/**
 * Kore brand mark — an aurora-gradient "K" in a rounded glass tile. Drawn as
 * inline SVG so it scales crisply, recolors with the theme, and needs no asset.
 */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center overflow-hidden rounded-xl ${className}`}>
      <svg viewBox="0 0 40 40" className="h-full w-full" role="img" aria-label="Kore">
        <defs>
          <linearGradient id="kore-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38e5cc" />
            <stop offset="0.55" stopColor="#7b5cff" />
            <stop offset="1" stopColor="#ff5ca8" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill="url(#kore-grad)" />
        <path
          d="M14 10.5v19M14 20l9-9.5M15.5 19.5L24 29.5"
          stroke="#08060f"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </span>
  );
}
