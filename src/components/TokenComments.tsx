"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract, useSignMessage } from "wagmi";
import { parseAbi } from "viem";
import { commentMessage, MAX_COMMENT_LEN, type TokenComment } from "@/lib/comments";

const erc20 = parseAbi(["function balanceOf(address account) view returns (uint256)"]);

function short(a: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

function ago(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/**
 * Holders-only chat on a profile coin. Anyone can read; only wallets that hold
 * the token can post — enforced by a wallet signature + an on-chain balance
 * check on the server.
 */
export function TokenComments({ token, symbol }: { token: `0x${string}`; symbol: string }) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [comments, setComments] = useState<TokenComment[] | null>(null);
  const [storage, setStorage] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const { data: bal } = useReadContract({
    address: token,
    abi: erc20,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });
  const balKnown = typeof bal === "bigint";
  const isHolder = balKnown && (bal as bigint) > 0n;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/token/${token}/comments`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setComments(d.comments ?? []);
        setStorage(d.storage !== false);
      })
      .catch(() => !cancelled && setComments([]));
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function post() {
    if (!address) return;
    const body = text.trim();
    if (!body) return;
    setErr(null);
    setPosting(true);
    try {
      const ts = Date.now();
      const signature = await signMessageAsync({ message: commentMessage(token, body, ts) });
      const r = await fetch(`/api/token/${token}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ author: address, text: body, ts, signature }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Couldn’t post the comment.");
      setText("");
      setComments((prev) => [d.comment as TokenComment, ...(prev ?? [])]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn’t post the comment.");
    } finally {
      setPosting(false);
    }
  }

  const canPost = isConnected && (isHolder || !balKnown) && !posting;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-zinc-900">Holders chat</h2>
        <span className="chip">${symbol} holders only</span>
      </div>

      {/* Composer */}
      {!storage ? (
        <p className="mt-3 text-xs text-zinc-500">Comments need server storage (KV) enabled.</p>
      ) : !isConnected ? (
        <p className="mt-3 text-xs text-zinc-500">Connect your wallet to chat.</p>
      ) : balKnown && !isHolder ? (
        <p className="mt-3 text-xs text-amber-600">Only ${symbol} holders can post here.</p>
      ) : (
        <div className="mt-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_COMMENT_LEN))}
            placeholder={`Say something to $${symbol} holders…`}
            rows={2}
            className="field resize-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">{text.length}/{MAX_COMMENT_LEN} · signs, no gas</span>
            <button onClick={post} disabled={!canPost || text.trim().length === 0} className="btn-brand !px-4 !py-2 text-xs">
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
          {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
        </div>
      )}

      {/* Thread */}
      <div className="mt-4 space-y-3 border-t border-ink-line pt-4">
        {comments === null ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-zinc-500">No comments yet. Be the first holder to chat.</p>
        ) : (
          comments.map((c, i) => (
            <div key={`${c.author}-${c.ts}-${i}`} className="text-sm">
              <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                <span className="font-mono text-pink">{short(c.author)}</span>
                <span>· {ago(c.ts)} ago</span>
              </div>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-zinc-700">{c.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
