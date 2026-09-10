/** Shared contract between the comments API and the client so the signed
 *  message matches byte-for-byte on both sides. */
export const MAX_COMMENT_LEN = 400;

export interface TokenComment {
  author: `0x${string}`;
  text: string;
  ts: number;
}

/** The message a holder signs to prove wallet ownership before posting. */
export function commentMessage(token: string, text: string, ts: number): string {
  return `Dime · sign to post a holders comment\n\nToken: ${token.toLowerCase()}\nComment: ${text}\nTime: ${ts}`;
}
