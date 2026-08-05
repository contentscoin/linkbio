"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUserPage } from "@/lib/current";
import {
  issuePageMcpToken,
  MCP_REVEAL_COOKIE,
  revokePageMcpToken,
} from "@/lib/mcp-token";

export async function issueMcpTokenAction() {
  const { page } = await requireUserPage();
  const { token } = await issuePageMcpToken(page.id);

  const store = await cookies();
  store.set(MCP_REVEAL_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/settings",
    maxAge: 120,
  });

  revalidatePath("/settings");
  redirect("/settings?saved=mcp-token");
}

export async function revokeMcpTokenAction() {
  const { page } = await requireUserPage();
  await revokePageMcpToken(page.id);
  revalidatePath("/settings");
  redirect("/settings?saved=mcp-revoked");
}
