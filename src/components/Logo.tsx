/**
 * Dime brand mark — the holographic glass "D" logo. Shipped as a static asset
 * (public/dime-logo.png) and rendered as an image so the exact artwork is used.
 */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center overflow-hidden rounded-xl ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/dime-logo.png" alt="Dime" className="h-full w-full object-cover" />
    </span>
  );
}
