/**
 * Kore brand mark — the app-icon artwork (public/kore-logo.png), rendered as an
 * image so the exact logo is used in the header, footer and favicon.
 */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center overflow-hidden rounded-xl ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/kore-logo.png" alt="Kore" className="h-full w-full object-cover" />
    </span>
  );
}
