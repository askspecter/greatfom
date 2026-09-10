# 🫆 Dime — tokenize your fomo.family profile

**Dime** turns a [fomo.family](https://fomo.family) profile into a token and launches it on
**[Pons](https://ponsfamily.com)** — the launchpad on Robinhood Chain — using the **bonding
curve**. Drop your handle, we draft your profile coin (name, ticker, bio, avatar, launch thread),
you tune it, and deploy in one signed transaction. Non-custodial: every transaction is signed by
your own wallet.

> Dime is a third-party interface to the Pons protocol, not an official Pons or fomo.family
> product. Not financial advice.

## ✨ What it does

- **Handle → profile coin:** paste your fomo.family handle and we draft a launch-ready package —
  name, ticker, one-line hook, profile lore, vibe tags, an X launch thread, and an avatar.
- **Fair launch:** every profile launches on a Pons **bonding curve** that graduates to
  Uniswap V4 (~4.2 ETH by default). Creators are paid in ETH.
- **Paired assets:** pair against ETH, or an RWA quote (USDG, NVDA, AAPL, and more) — only assets the
  factory has approved on-chain are offered.
- **Trade on the curve:** buy/sell any profile coin from its page while it's on the curve.
- **Creator fees:** claim curve fees credited to your wallet in the Pons fee escrow.
- **Non-custodial:** `wagmi` + `viem` + RainbowKit; the user's wallet signs every transaction.

## 🧱 Architecture

```
Frontend (Next.js, Dime UI)
   → ProfileStudio (handle → drafted package → editable launch form)
   → DeployButton → PonsAdapter → launchToken() → bonding curve → graduate to Uniswap V4
   → Wallet (wagmi/viem, Robinhood Chain, non-custodial)
```

| Path | Contents |
|---|---|
| `src/lib/pons/` | Launch adapter, registry (verified addresses), ABIs, on-chain readers, curve quote math |
| `src/lib/ai/` | Profile-package generation, avatar image, deterministic SVG fallback, ticker check |
| `src/lib/chain.ts` | Robinhood Chain definition (id 4663) |
| `src/app/api/*` | `generate`, `launches`, `feed`, `upload`, `img`, and token endpoints |
| `src/app/`, `src/components/` | Landing, launch studio, explore feed, profile-coin page, design system |

The Pons launch engine, wallet setup, and on-chain readers are carried over from the proven Pons
launch app; the profile-centric UI is built on top.

## 🚀 Running

```bash
cp .env.example .env.local   # set BANKR_API_KEY (or ANTHROPIC_API_KEY) to enable drafting
npm install
npm run dev                  # http://localhost:3000
```

Without a drafting key, drafting is disabled — users fill the launch fields by hand and upload an avatar;
the on-chain launch still works. Image storage (KV/Upstash) powers avatar uploads and the explore
feed; without it, on-chain reads still work.

## 🔑 Environment

See [`.env.example`](./.env.example) for the full list: drafting provider keys, image storage (Vercel KV /
Upstash), WalletConnect project id, and chain/explorer/contract overrides.

## ⚠️ Notes

- Pons is deployed but **unaudited**, and public launches are **whitelist-gated on-chain**. If a
  wallet isn't whitelisted the launch reverts (only gas is spent). The studio checks `canLaunch()`
  and warns before you sign.
- Token symbols aren't unique on-chain; the ticker check is a collision **warning**, not a
  reservation.

## 🧱 Stack

Next.js 14 (App Router) · TypeScript · Tailwind · wagmi + viem + RainbowKit · zod.
