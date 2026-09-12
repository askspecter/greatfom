"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { isAddress } from "viem";
import { AssetLogo } from "./AssetLogo";

export interface QuoteAsset {
  asset: string;
  symbol: string;
  name: string;
}

/**
 * "Paired asset" picker — dark glass dropdown showing ticker + full name.
 * A square badge stands in for a token logo (we don't host per-asset art).
 */
export function QuoteAssetSelect({
  assets,
  value,
  onChange,
}: {
  assets: QuoteAsset[];
  value: string;
  onChange: (asset: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Custom paired tokens the user pasted (any approved Robinhood Chain ERC-20).
  const [custom, setCustom] = useState<QuoteAsset[]>([]);
  const [paste, setPaste] = useState("");
  const [checking, setChecking] = useState(false);
  const [pasteErr, setPasteErr] = useState<string | null>(null);

  const allAssets = useMemo(() => {
    const seen = new Set(assets.map((a) => a.asset.toLowerCase()));
    return [...assets, ...custom.filter((c) => !seen.has(c.asset.toLowerCase()))];
  }, [assets, custom]);

  const selected = allAssets.find((a) => a.asset.toLowerCase() === value.toLowerCase()) ?? allAssets[0];

  async function addPasted() {
    const a = paste.trim();
    if (!isAddress(a)) {
      setPasteErr("Enter a valid token address (0x…).");
      return;
    }
    setPasteErr(null);
    setChecking(true);
    try {
      const r = await fetch(`/api/v2/pair-token?address=${a}`, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Couldn’t read that token.");
      if (!d.approved) {
        setPasteErr(`$${d.symbol} isn’t an approved Pons pair yet, so a launch against it would revert.`);
        return;
      }
      const entry: QuoteAsset = { asset: d.address, symbol: d.symbol, name: d.name };
      setCustom((prev) => [entry, ...prev.filter((p) => p.asset.toLowerCase() !== entry.asset.toLowerCase())]);
      onChange(entry.asset);
      setPaste("");
      setOpen(false);
    } catch (e) {
      setPasteErr(e instanceof Error ? e.message : "Couldn’t read that token.");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-xl border border-ink-line bg-white/70 px-3 py-2.5 text-left transition hover:border-black/15"
      >
        {selected && <AssetLogo symbol={selected.symbol} size={24} />}
        <span className="font-bold text-zinc-900">{selected?.symbol}</span>
        <span className="truncate text-xs text-zinc-500">{selected?.name}</span>
        <span className="ml-auto text-xs text-zinc-500">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          className="thin-scroll absolute z-40 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-ink-line p-1"
          style={{
            backgroundColor: "#0d0d16",
            boxShadow: "0 24px 60px -20px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        >
          {allAssets.map((a) => {
            const active = a.asset.toLowerCase() === value.toLowerCase();
            return (
              <button
                type="button"
                key={a.asset}
                onClick={() => {
                  onChange(a.asset);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                  active ? "bg-pink/15 text-zinc-900" : "text-zinc-800 hover:bg-white/[0.06]"
                }`}
              >
                <AssetLogo symbol={a.symbol} size={26} />
                <span className="font-bold">{a.symbol}</span>
                <span className="ml-auto truncate text-xs text-zinc-500">{a.name}</span>
              </button>
            );
          })}

          {/* Paste any Robinhood Chain token CA to pair against it */}
          <div className="mt-1 border-t border-ink-line px-2 pb-1 pt-2">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              Or paste a token address
            </div>
            <div className="flex items-center gap-2">
              <input
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPasted();
                  }
                }}
                placeholder="0x… token CA"
                className="field !py-2 font-mono text-xs"
              />
              <button
                type="button"
                onClick={addPasted}
                disabled={checking}
                className="btn-brand shrink-0 !px-3 !py-2 text-xs"
              >
                {checking ? "…" : "Add"}
              </button>
            </div>
            {pasteErr && <p className="mt-1.5 text-[11px] text-amber-500">{pasteErr}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
