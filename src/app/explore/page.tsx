"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FeedItem {
  token: string;
  name: string | null;
  symbol: string | null;
  logo: string;
  handle?: string;
}

function isAddress(v: string): v is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(v.trim());
}

export default function ExplorePage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<FeedItem[] | null>(null);

  const valid = useMemo(() => isAddress(q), [q]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/launches?limit=12", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => !cancelled && setRecent(d.items ?? []))
      .catch(() => !cancelled && setRecent([]));
    return () => {
      cancelled = true;
    };
  }, []);

  function go() {
    if (valid) router.push(`/launch/${q.trim()}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:pt-14">
      <h1 className="font-display text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
        <span className="grad-text">Explore</span>
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Paste a token contract address to open its page. Trade on the curve, see holders, and chat.
      </p>

      <div className="mt-5 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="0x… contract address"
          className="field font-mono"
          spellCheck={false}
        />
        <button onClick={go} disabled={!valid} className="btn-brand shrink-0">
          Find →
        </button>
      </div>
      {q.length > 0 && !valid && (
        <p className="mt-2 text-xs text-amber-600">Enter a full 0x… contract address (42 characters).</p>
      )}

      <div className="mt-10">
        <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Recent on Dime</h2>
        {recent === null ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card h-20 animate-pulse" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No profiles launched on Dime yet.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {recent.map((it) => (
              <Link key={it.token} href={`/launch/${it.token}`} className="card card-hover flex items-center gap-3 p-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink-line bg-white">
                  {it.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.logo} alt={it.symbol ?? "token"} className="h-full w-full object-cover" />
                  ) : (
                    <span>🫥</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-bold text-zinc-900">{it.name ?? "Unnamed"}</div>
                  {it.symbol && <div className="font-mono text-xs text-pink">${it.symbol}</div>}
                </div>
                {it.handle && <span className="chip ml-auto shrink-0">@{it.handle.replace(/^@+/, "")}</span>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
