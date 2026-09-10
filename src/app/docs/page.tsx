import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { V2_GRADUATION_THRESHOLD_ETH } from "@/lib/pons";

export const metadata: Metadata = {
  title: "Docs",
  description: "How Dime tokenizes fomo.family profiles on the Pons bonding curve.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-zinc-600">{children}</div>
    </section>
  );
}

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:pt-14">
      <h1 className="font-display text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">Docs</h1>
      <p className="mt-2 text-sm text-zinc-600">
        {SITE.name} turns a fomo.family profile into a token and launches it on the {SITE.poweredBy}
        bonding curve, on {SITE.chain}. Everything is non-custodial.
      </p>

      <div className="mt-6 space-y-4">
        <Section title="What is a profile coin?">
          <p>
            A profile coin is an ERC-20 that represents a fomo.family profile. It launches on a{" "}
            {SITE.poweredBy} bonding curve holding the full supply. As people buy in, the curve
            fills and the price rises along the curve; once it reaches its graduation threshold
            (~{V2_GRADUATION_THRESHOLD_ETH} ETH by default) it auto-graduates into a permanently-locked
            Uniswap V4 pool.
          </p>
        </Section>

        <Section title="How launching works">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Enter your fomo.family handle (plus an optional name, bio and vibe).</li>
            <li>We draft a profile coin: name, ticker, one-line hook, lore, an X thread, and an avatar.</li>
            <li>Review and edit any field, upload your own avatar, and pick a paired asset.</li>
            <li>Connect your wallet and sign one transaction. The profile launches on the curve.</li>
          </ol>
          <p>
            The launch is simulated on-chain before you sign, so a launch that would revert is caught
            first (only gas is at risk).
          </p>
        </Section>

        <Section title="Paired assets">
          <p>
            Profiles pair against native ETH by default. {SITE.poweredBy} also supports RWA quote
            assets (such as USDG, NVDA, AAPL). Only assets the factory has approved on-chain are
            offered, so a launch can never settle on an unsupported pairing.
          </p>
        </Section>

        <Section title="Trading and graduation">
          <p>
            While a profile is on the curve you can buy and sell directly against it from its page.
            Estimates assume zero snipe tax; a launch’s opening seconds may tax buys more, so raise
            slippage if a trade reverts. After graduation, trading moves to the Uniswap V4 pool.
          </p>
        </Section>

        <Section title="Creator fees">
          <p>
            Curve fees accrue to the creator’s wallet in the {SITE.poweredBy} fee escrow and are
            payable in ETH (plus the quote token for RWA pairs). Claim them from your profile page or
            a coin’s page. Fees are credited after a sweep, so a zero balance doesn’t always mean zero
            lifetime earnings.
          </p>
        </Section>

        <Section title="Whitelist note">
          <p>
            {SITE.poweredBy} is deployed but unaudited, and public launches are whitelist-gated
            on-chain. If your wallet isn’t whitelisted the launch will revert (only gas is spent). The
            studio checks this up front and warns you before you sign.
          </p>
        </Section>

        <Section title="Non-custodial">
          <p>
            {SITE.name} never holds your funds or keys. Every launch, trade and claim is a transaction
            your own wallet signs on {SITE.chain}. This is a third-party interface to the{" "}
            {SITE.poweredBy} protocol, not an official {SITE.poweredBy} or fomo.family product.
          </p>
        </Section>
      </div>

      <div className="mt-8 flex gap-3">
        <Link href="/create" className="btn-brand">Launch my profile →</Link>
        <Link href="/" className="btn-ghost">Explore profiles</Link>
      </div>
    </div>
  );
}
