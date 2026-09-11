import type { Metadata } from "next";
import Link from "next/link";
import { BuyFeed } from "@/components/BuyFeed";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Live buys",
  description: "Live buy activity across every profile coin on Kore.",
};

export default function ActivityPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-10 sm:pt-14">
      <div className="mb-6">
        <span className="eyebrow">
          <span className="pulse-dot" /> Live on {SITE.poweredBy}
        </span>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-zinc-900">
          Live <span className="grad-text">buys</span>
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Every buy across Kore profile coins, streaming in as it happens on the bonding curve.
        </p>
        <div className="mt-4">
          <Link href="/create" className="btn-brand">Launch my profile →</Link>
        </div>
      </div>

      <BuyFeed />
    </div>
  );
}
