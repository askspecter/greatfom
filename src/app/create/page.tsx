import type { Metadata } from "next";
import { ProfileStudio } from "@/components/ProfileStudio";

export const metadata: Metadata = {
  title: "Launch",
  description: "Tokenize your fomo.family profile and launch it on the Pons bonding curve.",
};

export default function CreatePage({ searchParams }: { searchParams: { handle?: string } }) {
  const initialHandle = typeof searchParams?.handle === "string" ? searchParams.handle : "";
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:pt-14">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
          Launch your <span className="grad-text">profile coin</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          Detect it from your fomo.family handle, tune every field, then launch on the Pons bonding
          curve. Your wallet signs the transaction. Nothing is custodied.
        </p>
      </div>
      <ProfileStudio initialHandle={initialHandle} />
    </div>
  );
}
