import type { Metadata, Viewport } from "next";
import "@rainbow-me/rainbowkit/styles.css"; // REQUIRED, before globals — styles the connect modal
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BottomNav } from "@/components/BottomNav";
import { WalletGate } from "@/components/WalletGate";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} · tokenize your fomo.family profile`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  icons: {
    icon: "/dime-logo.png",
    apple: "/dime-logo.png",
  },
  openGraph: {
    title: `${SITE.name} · tokenize your fomo.family profile`,
    description: SITE.description,
    type: "website",
    images: ["/dime-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} · tokenize your fomo.family profile`,
    description: SITE.description,
    images: ["/dime-logo.png"],
    site: SITE.xHandle,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05060a",
};

// Render at request time, not static export. RainbowKit's config throws
// "reading 'uid'" during Next's static prerender step, so skip prerender.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/*
          One-time cleanup of stale wallet state. Old wallet/WalletConnect keys
          can be in shapes the current setup can't rehydrate, which threw in the
          providers on mobile Safari. This runs before React hydrates and drops
          any stale wallet keys once per version so RainbowKit starts clean.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var V='fomo-wallet-reset-1';if(localStorage.getItem('fomo.walletReset')===V)return;var kill=/^(wagmi|wc@2|walletconnect|WALLETCONNECT|rk-|@rainbow|fomo\\.wagmi|W3M|WCM|@w3m|@appkit|reown|@reown|CBWSDK|-walletlink)/i;Object.keys(localStorage).forEach(function(k){if(kill.test(k))localStorage.removeItem(k)});localStorage.setItem('fomo.walletReset',V)}catch(e){}})();",
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="cinema-bg" aria-hidden />
        <div className="grain" aria-hidden />
        <Providers>
          <div className="flex min-h-dvh flex-col overflow-x-hidden">
            <SiteHeader />
            <main className="flex-1 pb-24 md:pb-0">{children}</main>
            <SiteFooter />
          </div>
          <BottomNav />
          <WalletGate />
        </Providers>
      </body>
    </html>
  );
}
