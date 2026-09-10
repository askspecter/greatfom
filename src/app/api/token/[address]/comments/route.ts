import { NextResponse } from "next/server";
import { getAddress, isAddress, parseAbi, recoverMessageAddress, type Address } from "viem";
import { getKv } from "@/lib/kv";
import { ponsClient } from "@/lib/pons/reader";
import { commentMessage, MAX_COMMENT_LEN, type TokenComment } from "@/lib/comments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Holders-only comments on a profile coin.
 *   GET  → recent comments (newest first).
 *   POST → add a comment; the wallet must SIGN the message and HOLD the token.
 *
 * Gating is enforced server-side: the signature must recover to the claimed
 * author, and that address must have a non-zero on-chain balance of the token.
 */
const erc20 = parseAbi(["function balanceOf(address account) view returns (uint256)"]);
const MAX_STORED = 200;
const key = (token: string) => `comments:${token.toLowerCase()}`;

export async function GET(_req: Request, { params }: { params: { address: string } }) {
  const token = params.address;
  if (!isAddress(token)) return NextResponse.json({ error: "Invalid token address.", comments: [] }, { status: 400 });

  const kv = getKv();
  if (!kv) return NextResponse.json({ comments: [], storage: false });

  try {
    const comments = (await kv.get<TokenComment[]>(key(token))) ?? [];
    return NextResponse.json({ comments, storage: true });
  } catch {
    return NextResponse.json({ comments: [], storage: true });
  }
}

export async function POST(req: Request, { params }: { params: { address: string } }) {
  const token = params.address;
  if (!isAddress(token)) return NextResponse.json({ error: "Invalid token address." }, { status: 400 });

  const kv = getKv();
  if (!kv) return NextResponse.json({ error: "Comments storage isn’t configured on the server." }, { status: 503 });

  let body: { author?: string; text?: string; ts?: number; signature?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  const ts = Number(body.ts);
  const signature = body.signature as `0x${string}` | undefined;
  const author = body.author;

  if (!author || !isAddress(author)) return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  if (text.length === 0) return NextResponse.json({ error: "Comment is empty." }, { status: 400 });
  if (text.length > MAX_COMMENT_LEN) return NextResponse.json({ error: `Max ${MAX_COMMENT_LEN} characters.` }, { status: 400 });
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > 10 * 60_000) {
    return NextResponse.json({ error: "Stale request. Try again." }, { status: 400 });
  }

  // 1) Prove wallet ownership: the signature must recover to the author.
  let recovered: Address;
  try {
    recovered = await recoverMessageAddress({ message: commentMessage(token, text, ts), signature });
  } catch {
    return NextResponse.json({ error: "Bad signature." }, { status: 400 });
  }
  if (getAddress(recovered) !== getAddress(author)) {
    return NextResponse.json({ error: "Signature doesn’t match the wallet." }, { status: 401 });
  }

  // 2) Holders only: the address must own a non-zero balance of the token.
  try {
    const balance = (await ponsClient().readContract({
      address: getAddress(token),
      abi: erc20,
      functionName: "balanceOf",
      args: [getAddress(author)],
    })) as bigint;
    if (balance <= 0n) {
      return NextResponse.json({ error: `Only ${"holders"} of this token can comment.` }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Couldn’t verify your holdings on-chain. Try again." }, { status: 502 });
  }

  const comment: TokenComment = { author: getAddress(author), text, ts: Date.now() };
  try {
    const existing = (await kv.get<TokenComment[]>(key(token))) ?? [];
    const next = [comment, ...existing].slice(0, MAX_STORED);
    await kv.set(key(token), next);
  } catch {
    return NextResponse.json({ error: "Couldn’t save the comment. Try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, comment });
}
