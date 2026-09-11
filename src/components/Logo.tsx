/**
 * Kore brand mark — the supplied mark on a transparent background
 * (public/kore-logo.png), rendered with object-contain so it sits cleanly on
 * any surface with no box behind it.
 */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/kore-logo.png" alt="Kore" className="h-full w-full object-contain" />
    </span>
  );
}
