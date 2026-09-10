"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { WalletButton } from "@/components/WalletButton";
import { ClaimFees } from "@/components/ClaimFees";

interface LaunchRecord {
  token: string;
  name: string;
  symbol: string;
  logo: string;
  handle?: string;
  createdAt: number;
}

function short(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const [items, setItems] = useState<LaunchRecord[] | null>(null);

  useEffect(() => {
    if (!address) {
      setItems(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/launches?deployer=${address}&limit=100`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => !cancelled && setItems(d.items ?? []))
      .catch(() => !cancelled && setItems([]));
    return () => {
      cancelled = true;
    };
  }, [address]);

  return (
    <div className="mx-auto max-w-4xl px-4 pt-10 sm:pt-14">
      <h1 className="font-display text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
        My <span className="grad-text">profile</span>
      </h1>
      <p className="mt-2 text-sm text-zinc-600">Profile coins you’ve launched, and the creator fees you can claim.</p>

      {!isConnected ? (
        <div className="card mt-6 p-10 text-center">
          <p className="text-sm text-zinc-600">Connect your wallet to see your launches.</p>
          <div className="mt-4 flex justify-center">
            <WalletButton variant="solid" />
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <ClaimFees />

          <section className="card p-5">
            <h2 className="text-sm font-medium text-zinc-700">Your launches</h2>
            {items === null ? (
              <div className="mt-3 h-24 animate-pulse rounded-xl bg-black/[0.04]" />
            ) : items.length === 0 ? (
              <div className="mt-3 text-sm text-zinc-500">
                No launches recorded for {short(address!)} yet.{" "}
                <Link href="/create" className="text-pink underline underline-offset-2">Launch your profile →</Link>
              </div>
            ) : (
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {items.map((it) => (
                  <li key={it.token}>
                    <Link href={`/launch/${it.token}`} className="card card-hover flex items-center gap-3 p-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink-line bg-white">
                        {it.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={it.logo} alt={it.symbol} className="h-full w-full object-cover" />
                        ) : (
                          <span>🫥</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-zinc-900">{it.name || short(it.token)}</div>
                        <div className="font-mono text-xs text-pink">${it.symbol}{it.handle ? ` · @${it.handle}` : ""}</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[11px] text-zinc-400">
              This list is drawn from launches made through {`Dime`} with image storage
              configured. On-chain, your launches are always yours regardless of this list.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
