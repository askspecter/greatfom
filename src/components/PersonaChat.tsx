"use client";

import { useEffect, useRef, useState } from "react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

/**
 * Talk to the coin. Every coined profile has an AI persona that chats in
 * character on its own page, grounded in the coin's name, ticker, hook and
 * handle. Hides itself when the server has no AI provider configured.
 */
export function PersonaChat({
  token,
  name,
  symbol,
  description,
  handle,
  source,
  logo,
}: {
  token: string;
  name: string;
  symbol: string;
  description?: string;
  handle?: string;
  source?: "fomo" | "x";
  logo?: string;
}) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const profile = { name, symbol, description, handle, source };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(history: Msg[]) {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/token/${token}/persona`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile, messages: history }),
      });
      const d = await r.json();
      if (r.ok && d.configured === false) {
        setAvailable(false);
        return;
      }
      setAvailable(true);
      if (!r.ok) throw new Error(d.error ?? "The persona could not reply.");
      setMessages([...history, { role: "assistant", content: d.reply as string }]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "The persona could not reply.");
    } finally {
      setBusy(false);
    }
  }

  // Kick off with a persona greeting on first mount.
  useEffect(() => {
    send([{ role: "user", content: "gm, introduce yourself in one line." }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function submit() {
    const body = text.trim();
    if (!body || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: body }];
    setMessages(next);
    setText("");
    void send(next);
  }

  // Hide entirely if the server can't run a persona.
  if (available === false) return null;

  // Drop the seed "gm" prompt from the visible transcript.
  const visible = messages.filter((m, i) => !(i === 0 && m.role === "user"));

  return (
    <div className="card relative overflow-hidden p-5">
      <div
        className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(56,229,204,0.5), transparent 62%)" }}
        aria-hidden
      />
      <div className="relative flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900">
          Talk to <span className="grad-text">${symbol}</span>
        </h2>
        <span className="chip chip-accent">AI persona</span>
      </div>
      <p className="relative mt-1 text-[11px] text-zinc-500">
        An AI in character as this profile. For fun, not financial advice.
      </p>

      {/* Transcript */}
      <div ref={scrollRef} className="relative mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
        {visible.length === 0 && busy && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-400/40 border-t-zinc-400" />
            waking up the persona…
          </div>
        )}
        {visible.map((m, i) =>
          m.role === "assistant" ? (
            <div key={i} className="flex items-start gap-2">
              <div className="mt-0.5 h-7 w-7 shrink-0 overflow-hidden rounded-lg border border-ink-line bg-white/5">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt={symbol} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs">🪙</span>
                )}
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-ink-line bg-white/[0.04] px-3 py-2 text-sm text-zinc-800">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-pink/90 px-3 py-2 text-sm text-white">
                {m.content}
              </div>
            </div>
          ),
        )}
        {visible.length > 0 && busy && (
          <div className="flex items-center gap-1.5 pl-9 text-zinc-400">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="relative mt-3 flex items-center gap-2 border-t border-ink-line pt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 300))}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={`Ask $${symbol} anything…`}
          className="field !py-2"
          disabled={busy && visible.length === 0}
        />
        <button
          onClick={submit}
          disabled={busy || text.trim().length === 0}
          className="btn-brand shrink-0 !px-4 !py-2 text-sm"
        >
          Send
        </button>
      </div>
      {err && <p className="relative mt-2 text-xs text-red-600">{err}</p>}
    </div>
  );
}
