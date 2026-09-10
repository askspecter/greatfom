import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:pt-14">
      <h1 className="font-display text-3xl font-black tracking-tight text-zinc-900">Privacy Policy</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-zinc-600">
        <p>
          {SITE.name} is designed to collect as little as possible. It has no accounts and no
          server-side tracking of individuals.
        </p>
        <h2 className="pt-2 text-base font-bold text-zinc-900">What is processed</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Wallet address:</strong> when you connect, your public address is used in the
            browser to read balances and build transactions. It is not linked to any identity by us.
          </li>
          <li>
            <strong>Profile inputs:</strong> the handle, name, bio and vibe you enter are sent to our
            drafting service to draft your profile coin. Don’t enter anything you consider
            private.
          </li>
          <li>
            <strong>Avatars:</strong> images you upload are stored to serve your token’s logo. They
            are public by design (a token logo shows in the feed and wallets).
          </li>
          <li>
            <strong>Launch records:</strong> a token address, name, ticker, handle and your public
            deployer address may be stored to power the explore feed. You can request removal by
            signing a message from the deploying wallet.
          </li>
        </ul>
        <h2 className="pt-2 text-base font-bold text-zinc-900">On-chain data</h2>
        <p>
          Transactions you sign are recorded permanently on {SITE.chain} and are outside {SITE.name}’s
          control. Anything written on-chain (including token metadata and social links) is public and
          cannot be deleted.
        </p>
        <h2 className="pt-2 text-base font-bold text-zinc-900">Third parties</h2>
        <p>
          Connecting a wallet, generating copy or images, and reading the chain involve third-party
          services (your wallet, the drafting service, RPC and explorer endpoints), each governed by
          its own policies.
        </p>
      </div>
    </div>
  );
}
