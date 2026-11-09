import { resolveMx, type MxRecord } from "node:dns/promises";

export type MxLookup = (domain: string) => Promise<readonly MxRecord[]>;

export async function emailDomainAcceptsMail(
  email: string,
  lookup: MxLookup = resolveMx,
): Promise<boolean> {
  const domain = email.slice(email.lastIndexOf("@") + 1);
  if (!domain) {
    return false;
  }

  try {
    const records = await lookup(domain);
    return records.length > 0;
  } catch {
    return false;
  }
}
