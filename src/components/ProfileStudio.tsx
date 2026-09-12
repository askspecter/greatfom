"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { zeroAddress } from "viem";
import { QuoteAssetSelect, type QuoteAsset } from "./QuoteAssetSelect";
import { DeployButton } from "./DeployButton";
import { uploadLogo } from "@/lib/upload";
import { V2_GRADUATION_THRESHOLD_ETH } from "@/lib/pons";
import type { LaunchInput } from "@/lib/pons";

interface LaunchOptions {
  launchFee: string;
  canLaunch: boolean | null;
  configs: { id: string }[];
  quoteAssets: QuoteAsset[];
}

const ETH_ASSET: QuoteAsset = {
  asset: zeroAddress,
  symbol: "ETH",
  name: "Ether",
};

/** Normalize a handle for display + ticker seeding. */
function cleanHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "");
}

export function ProfileStudio({ initialHandle = "" }: { initialHandle?: string }) {
  const { address } = useAccount();

  // ── What kind of profile are we coining? ──
  const [source, setSource] = useState<"fomo" | "x">("fomo");

  // ── Profile seed inputs ──
  const [handle, setHandle] = useState(cleanHandle(initialHandle));
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string>("");

  // ── Resolved fomo.family profile (real data + creator-fee wallet) ──
  const [fomo, setFomo] = useState<{
    handle: string;
    displayName: string;
    verified: boolean;
    wallet: string | null;
  } | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [feeWallet, setFeeWallet] = useState<`0x${string}` | undefined>(undefined);

  // ── Resolved X profile (when coining from X) ──
  const [xProfile, setXProfile] = useState<{
    handle: string;
    displayName: string;
    verified: boolean;
    followers: number | null;
  } | null>(null);

  // Editable launch fields
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [description, setDescription] = useState("");
  const [twitter, setTwitter] = useState("");
  const [website, setWebsite] = useState("");
  const [initialBuy, setInitialBuy] = useState("");
  const [buyback, setBuyback] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Launch options (live from the factory) ──
  const [options, setOptions] = useState<LaunchOptions | null>(null);
  const [pairToken, setPairToken] = useState<string>(zeroAddress);

  useEffect(() => {
    const url = address ? `/api/v2/launch-options?address=${address}` : "/api/v2/launch-options";
    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: LaunchOptions) => setOptions(d))
      .catch(() => setOptions(null));
  }, [address]);

  // Prefilled via /create?handle=… (e.g. the Tokenize button on the leaderboard):
  // auto-detect the profile on first load.
  useEffect(() => {
    if (cleanHandle(initialHandle).length >= 2) detectProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quoteAssets = useMemo<QuoteAsset[]>(() => {
    const list = options?.quoteAssets ?? [];
    if (list.length === 0) return [ETH_ASSET];
    return list;
  }, [options]);

  /**
   * Detect the real fomo.family profile behind the handle: prefill name, bio
   * and avatar from live data, and capture the profile's EVM wallet so creator
   * fees route to that person at launch.
   */
  async function detectProfile() {
    const h = cleanHandle(handle);
    if (h.length < 2) {
      setDetectError("Enter your fomo.family handle first.");
      return;
    }
    setDetectError(null);
    setDetecting(true);
    setXProfile(null);
    try {
      const res = await fetch(`/api/fomo/${encodeURIComponent(h)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't detect that profile.");
      const p = data.profile as {
        handle: string;
        displayName: string;
        bio: string;
        avatar: string;
        verified: boolean;
        wallets: { evm: string | null };
      };
      setFomo({ handle: p.handle, displayName: p.displayName, verified: p.verified, wallet: p.wallets.evm });
      // Prefill real profile data — everything stays editable before launch.
      if (p.displayName) {
        setDisplayName(p.displayName);
        setName((prev) => prev || p.displayName);
      }
      if (p.bio) {
        setBio(p.bio);
        setDescription((prev) => prev || p.bio.split("\n")[0].slice(0, 280));
      }
      if (p.avatar) setAvatar(p.avatar);
      setFeeWallet((p.wallets.evm as `0x${string}`) ?? undefined);
    } catch (err) {
      setFomo(null);
      setFeeWallet(undefined);
      setDetectError(err instanceof Error ? err.message : "Couldn't detect that profile.");
    } finally {
      setDetecting(false);
    }
  }

  /**
   * Pull an X (Twitter) profile: grab the avatar from a public avatar service
   * and seed the coin name + X link from the handle. X profiles carry no
   * on-chain wallet, so creator fees fall back to the connected wallet.
   */
  async function detectX() {
    const h = cleanHandle(handle);
    if (h.length < 1) {
      setDetectError("Enter your X handle first.");
      return;
    }
    setDetectError(null);
    setDetecting(true);
    setFomo(null);
    setFeeWallet(undefined); // X carries no on-chain wallet → fees go to connected wallet
    try {
      // Try the official X API first (real name + verified badge). Falls back to
      // an avatar-only path when the server has no X_BEARER_TOKEN configured.
      const res = await fetch(`/api/x/${encodeURIComponent(h)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't load that X profile.");

      if (data.configured && data.profile) {
        const p = data.profile as {
          handle: string;
          displayName: string;
          bio: string;
          avatar: string;
          verified: boolean;
          followers: number | null;
        };
        setXProfile({ handle: p.handle, displayName: p.displayName, verified: p.verified, followers: p.followers });
        setAvatar(p.avatar || `https://unavatar.io/x/${encodeURIComponent(h)}`);
        setDisplayName((prev) => prev || p.displayName);
        setName((prev) => prev || p.displayName);
        if (p.bio) setDescription((prev) => prev || p.bio.split("\n")[0].slice(0, 280));
        setTwitter((prev) => prev || `https://x.com/${p.handle}`);
      } else {
        // Avatar-only fallback (no X API key on the server).
        setXProfile({ handle: h, displayName: `@${h}`, verified: false, followers: null });
        setAvatar(`https://unavatar.io/x/${encodeURIComponent(h)}`);
        setDisplayName((prev) => prev || `@${h}`);
        setName((prev) => prev || h);
        setDescription((prev) => prev || `@${h} on X, coined on Kore.`);
        setTwitter((prev) => prev || `https://x.com/${h}`);
      }
    } catch (err) {
      setXProfile(null);
      setDetectError(err instanceof Error ? err.message : "Couldn't load that X profile.");
    } finally {
      setDetecting(false);
    }
  }

  const detect = () => (source === "x" ? detectX() : detectProfile());

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadLogo(file);
      setAvatar(url);
    } catch (err) {
      setDetectError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const launchConfigId = options?.configs?.[0]?.id ? Number(options.configs[0].id) : 0;

  const launchInput: LaunchInput = {
    version: "v2",
    name: name.trim() || cleanHandle(handle),
    ticker: ticker.trim().toUpperCase().replace(/[^A-Z0-9]/g, ""),
    description: description.trim(),
    imageUri: avatar,
    creatorFeeRecipient: feeWallet,
    quoteAsset: "ETH",
    pairToken: pairToken as `0x${string}`,
    launchConfigId,
    buybackEnabled: buyback,
    initialBuyEth: initialBuy && Number(initialBuy) > 0 ? initialBuy : undefined,
    twitter: twitter.trim() || undefined,
    website: website.trim() || undefined,
  };

  const isNativePair = pairToken.toLowerCase() === zeroAddress.toLowerCase();
  const canDeploy = launchInput.ticker.length >= 2 && launchInput.name.length >= 1;
  const feeEth = options?.launchFee ? Number(options.launchFee) / 1e18 : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,0.9fr]">
      {/* ── Left: choose a profile source + editable seed ── */}
      <section className="card p-5 sm:p-6">
        <div className="eyebrow">
          <span className="step-badge">1</span> Choose what to coin
        </div>

        {/* Source toggle: Fomo profile or X profile */}
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-ink-line bg-white/40 p-1">
          {([
            { id: "fomo", label: "Fomo profile" },
            { id: "x", label: "X profile" },
          ] as const).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setSource(opt.id);
                setDetectError(null);
              }}
              className={
                "rounded-lg px-3 py-2 text-sm font-semibold transition " +
                (source === opt.id
                  ? "bg-pink text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800")
              }
            >
              {opt.id === "x" ? "𝕏 " : ""}
              {opt.label}
            </button>
          ))}
        </div>

        <p className="mt-3 text-sm text-zinc-600">
          {source === "x"
            ? "Drop your X handle and pull your profile. We grab your X avatar and prefill your coin — everything stays editable. X profiles have no on-chain wallet, so creator fees route to your connected wallet."
            : "Drop your fomo.family handle and detect your profile. We pull your name, avatar and bio straight from fomo.family, and route creator fees to your profile’s wallet. Everything stays editable before you launch."}
        </p>

        <label className="mt-5 block text-xs font-semibold text-zinc-500">
          {source === "x" ? "X handle" : "Handle"}
        </label>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm text-zinc-400">@</span>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="yourname"
            className="field"
          />
        </div>

        <button className="btn-brand mt-4 w-full" onClick={detect} disabled={detecting}>
          {detecting && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {detecting
            ? "Detecting…"
            : source === "x"
              ? "Pull my X profile"
              : fomo
                ? "Re-detect profile"
                : "Detect my fomo.family profile"}
        </button>
        {detectError && <p className="mt-2 text-xs text-red-600">{detectError}</p>}
        {fomo && (
          <div className="mt-3 rounded-xl border border-ink-line bg-white/50 p-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-700">
              @{fomo.handle}
              {fomo.verified && <span className="text-pink" title="Verified on fomo.family">✓</span>}
            </div>
            {fomo.wallet ? (
              <p className="mt-1 text-zinc-500">
                Creator fees route to this profile’s wallet:{" "}
                <span className="font-mono text-zinc-700">
                  {fomo.wallet.slice(0, 6)}…{fomo.wallet.slice(-4)}
                </span>
              </p>
            ) : (
              <p className="mt-1 text-amber-600">
                No EVM wallet on this profile, so fees fall back to your connected wallet.
              </p>
            )}
          </div>
        )}
        {source === "x" && xProfile && (
          <div className="mt-3 rounded-xl border border-ink-line bg-white/50 p-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-700">
              @{xProfile.handle}
              {xProfile.verified && <span className="text-pink" title="Verified on X">✓</span>}
              {xProfile.followers != null && (
                <span className="ml-auto font-normal text-zinc-500">
                  {Intl.NumberFormat("en", { notation: "compact" }).format(xProfile.followers)} followers
                </span>
              )}
            </div>
            <p className="mt-1 text-amber-600">
              X profiles have no on-chain wallet, so creator fees route to your connected wallet.
            </p>
          </div>
        )}

        <div className="mt-4">
          <label className="block text-xs font-semibold text-zinc-500">Display name (optional)</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" className="field mt-1" />
        </div>

        <label className="mt-3 block text-xs font-semibold text-zinc-500">Bio (optional)</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A line or two about you."
          rows={3}
          className="field mt-1 resize-none"
        />
        <p className="mt-2 text-[11px] text-zinc-400">
          Detect fills these from fomo.family, or type them in by hand. Set the coin name, ticker and
          avatar on the right, then launch.
        </p>
      </section>

      {/* ── Right: editable package + launch ── */}
      <section className="card p-5 sm:p-6">
        <div className="eyebrow">
          <span className="step-badge">2</span> Review and launch
        </div>

        {/* Avatar */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-ink-line bg-white">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="Profile avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl">🫥</span>
            )}
          </div>
          <div className="text-sm">
            <button className="btn-ghost" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? "Uploading…" : avatar ? "Replace avatar" : "Upload avatar"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
            <p className="mt-1 text-[11px] text-zinc-400">PNG/JPG. Auto-compressed for on-chain use.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-zinc-500">Coin name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your profile coin" className="field mt-1" maxLength={40} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500">Ticker</label>
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))}
              placeholder="TICKER"
              className="field mt-1 font-mono"
              maxLength={10}
            />
          </div>
        </div>

        <label className="mt-3 block text-xs font-semibold text-zinc-500">One-line hook</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Who is this profile?" className="field mt-1" maxLength={280} />

        {/* Paired asset */}
        <label className="mt-4 block text-xs font-semibold text-zinc-500">Paired asset (quote)</label>
        <div className="mt-1">
          <QuoteAssetSelect assets={quoteAssets} value={pairToken} onChange={setPairToken} />
        </div>
        <p className="mt-1.5 text-[11px] text-zinc-400">
          Pair against ETH, an RWA (NVDA, AAPL, TSLA, USDG…), or paste any Robinhood Chain token
          address to pair against it.
        </p>

        {/* Socials */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-zinc-500">X / Twitter (optional)</label>
            <input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/…" className="field mt-1" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500">Website (optional)</label>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" className="field mt-1" />
          </div>
        </div>

        {/* Initial buy + buyback */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-zinc-500">
              Initial buy {isNativePair ? "(ETH, optional)" : "(native only)"}
            </label>
            <input
              value={initialBuy}
              onChange={(e) => setInitialBuy(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0.0"
              inputMode="decimal"
              className="field mt-1 font-mono disabled:opacity-50"
              disabled={!isNativePair}
            />
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm text-zinc-600">
            <input type="checkbox" checked={buyback} onChange={(e) => setBuyback(e.target.checked)} className="h-5 w-5 accent-pink" />
            Enable protocol buybacks
          </label>
        </div>

        {/* Launch summary */}
        <div className="mt-4 space-y-1 rounded-xl border border-ink-line bg-white/50 p-3 text-xs text-zinc-500">
          <div className="flex justify-between"><span>Launch model</span><span className="font-semibold text-zinc-700">Pons · bonding curve</span></div>
          <div className="flex justify-between"><span>Graduates to</span><span className="text-zinc-700">Uniswap V4 (~{V2_GRADUATION_THRESHOLD_ETH} ETH)</span></div>
          {feeWallet && (
            <div className="flex justify-between">
              <span>Creator fees →</span>
              <span className="font-mono text-zinc-700">{feeWallet.slice(0, 6)}…{feeWallet.slice(-4)}</span>
            </div>
          )}
          {feeEth !== null && <div className="flex justify-between"><span>Launch fee</span><span className="font-mono text-zinc-700">{feeEth} ETH</span></div>}
          {options?.canLaunch === false && (
            <div className="pt-1 text-amber-600">This wallet isn’t whitelisted for launches yet, so the launch would revert.</div>
          )}
        </div>

        <div className="mt-4">
          <DeployButton input={launchInput} handle={cleanHandle(handle) || undefined} disabled={!canDeploy} />
        </div>
      </section>
    </div>
  );
}
