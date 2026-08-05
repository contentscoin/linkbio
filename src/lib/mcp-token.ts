import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { pages } from "@/db/schema";
import {
  generateMcpToken,
  getMcpTokenDisplayPrefix,
  hashMcpToken,
  isPersonalMcpToken,
} from "@/lib/mcp-token-core";

export const MCP_REVEAL_COOKIE = "omo_bio_mcp_reveal";

export async function issuePageMcpToken(pageId: string) {
  const token = generateMcpToken();
  const prefix = getMcpTokenDisplayPrefix(token);
  const createdAt = new Date();

  await getDb()
    .update(pages)
    .set({
      mcpTokenHash: hashMcpToken(token),
      mcpTokenPrefix: prefix,
      mcpTokenCreatedAt: createdAt,
      updatedAt: createdAt,
    })
    .where(eq(pages.id, pageId));

  return { token, prefix, createdAt };
}

export async function revokePageMcpToken(pageId: string) {
  await getDb()
    .update(pages)
    .set({
      mcpTokenHash: null,
      mcpTokenPrefix: null,
      mcpTokenCreatedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(pages.id, pageId));
}

export async function findPageByMcpToken(token: string) {
  if (!isPersonalMcpToken(token)) return null;

  const [page] = await getDb()
    .select({ id: pages.id, handle: pages.handle })
    .from(pages)
    .where(eq(pages.mcpTokenHash, hashMcpToken(token)))
    .limit(1);

  return page ?? null;
}

export function getPageMcpTokenStatus(page: {
  mcpTokenPrefix: string | null;
  mcpTokenCreatedAt: Date | null;
}) {
  return {
    hasToken: Boolean(page.mcpTokenPrefix),
    prefix: page.mcpTokenPrefix,
    createdAt: page.mcpTokenCreatedAt,
  };
}
