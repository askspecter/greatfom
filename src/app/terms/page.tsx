import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:pt-14">
      <h1 className="font-display text-3xl font-black tracking-tight text-zinc-900">Terms of Use</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-zinc-600">
        <p>
          {SITE.name} is a non-custodial, third-party interface to the {SITE.poweredBy} protocol on{" "}
          {SITE.chain}. By using it you agree to these terms. If you do not agree, do not use the app.
        </p>
        <h2 className="pt-2 text-base font-bold text-zinc-900">No custody, no advice</h2>
        <p>
          {SITE.name} never holds your funds or private keys. Every transaction is initiated and
          signed by your own wallet. Nothing here is financial, investment, legal or tax advice, and
          no outcome is promised. Tokens are highly volatile and can lose all value.
        </p>
        <h2 className="pt-2 text-base font-bold text-zinc-900">Your responsibility</h2>
        <p>
          You are responsible for the content of any profile coin you launch, including its name,
          ticker, imagery and links, and for ensuring you have the right to tokenize the profile in
          question. Do not launch profiles that impersonate others, infringe rights, or are unlawful
          in your jurisdiction. You confirm you are not located in, or a resident of, any restricted
          jurisdiction.
        </p>
        <h2 className="pt-2 text-base font-bold text-zinc-900">No affiliation</h2>
        <p>
          {SITE.name} is not affiliated with, endorsed by, or an official product of {SITE.poweredBy}{" "}
          or fomo.family. All protocol interactions occur on public smart contracts that {SITE.name}
          does not control.
        </p>
        <h2 className="pt-2 text-base font-bold text-zinc-900">As-is</h2>
        <p>
          The app is provided “as is,” without warranties of any kind. To the maximum extent permitted
          by law, {SITE.name} and its contributors are not liable for any losses arising from your use
          of the app or the underlying protocol.
        </p>
      </div>
    </div>
  );
}
