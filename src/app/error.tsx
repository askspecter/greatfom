"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 pt-20 text-center">
      <div className="card p-10">
        <h1 className="font-display text-2xl font-bold text-zinc-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-zinc-600">{error.message || "An unexpected error occurred."}</p>
        <div className="mt-5 flex justify-center gap-3">
          <button className="btn-brand" onClick={reset}>Try again</button>
          <Link href="/" className="btn-ghost">Go home</Link>
        </div>
      </div>
    </div>
  );
}
