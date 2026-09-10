"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { WagmiProvider, http, useReconnect } from "wagmi";
import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { robinhoodChain } from "@/lib/chain";

// Wallet connect — the exact working RainbowKit + wagmi v2 setup carried over
// from the proven Pons v2 launch app. RainbowKit's modal gives MetaMask /
// Browser Wallet / Rainbow / WalletConnect. WalletConnect negotiates an
// EVM-only (eip155) session, so multi-chain wallets connect on Robinhood.
//
// Stability depends on TWO things, both in place:
//   1. next.config.js webpack aliases stub the Coinbase/Base account SDKs that
//      wagmi's connector barrel eagerly imports.
//   2. NO viem `overrides` in package.json — WalletConnect keeps its own nested
//      viem. Forcing a single viem broke WalletConnect and crashed the app.
// And "@rainbow-me/rainbowkit/styles.css" is imported in layout.tsx.
const wagmiConfig = getDefaultConfig({
  appName: "Dime",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "fomo_missing_wc_project_id",
  chains: [robinhoodChain],
  transports: {
    [robinhoodChain.id]: http(undefined, { batch: true, retryCount: 6, retryDelay: 600 }),
  },
  ssr: true,
  wallets: [
    {
      groupName: "Popular",
      wallets: [metaMaskWallet, injectedWallet, rainbowWallet, walletConnectWallet],
    },
  ],
});

// Holographic dark theme to match the Dime glass logo.
const fomoTheme = darkTheme({
  accentColor: "#a9b8ff",
  accentColorForeground: "#0a0b16",
  borderRadius: "large",
  overlayBlur: "small",
  fontStack: "system",
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  // reconnectOnMount={false} is the crash fix. getDefaultConfig defaults it to
  // true, which auto-reconnects to a wallet stored from a previous visit. When
  // that wallet is on an unsupported chain, usePublicClient() resolves to
  // undefined and RainbowKit's transaction store throws "undefined is not an
  // object (evaluating 'e.uid')", blanking the app on mobile Safari. We
  // reconnect post-hydration instead (AutoReconnect below), which is safe.
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={fomoTheme} modalSize="compact">
          <AutoReconnect />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

/** Reconnect the last-used wallet AFTER mount (once), avoiding the SSR crash. */
function AutoReconnect() {
  const { reconnect } = useReconnect();
  useEffect(() => {
    try {
      reconnect();
    } catch {
      /* ignore */
    }
  }, [reconnect]);
  return null;
}
