"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireCurrentUserPage } from "@/lib/current";
import { issuePageMcpToken, MCP_REVEAL_COOKIE, revokePageMcpToken } from "@/lib/mcp-token";
import { redirectWithMessage } from "@/lib/messages";

function settingsSaved(message: string): never {
  redirect(redirectWithMessage("/settings", "saved", message));
}

export async function issueMcpTokenAction() {
  const current = await requireCurrentUserPage();
  const { token } = await issuePageMcpToken(current.page.id);

  const store = await cookies();
  store.set(MCP_REVEAL_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/settings",
    maxAge: 120,
  });

  revalidatePath("/settings");
  settingsSaved("mcp-token");
}

export async function revokeMcpTokenAction() {
  const current = await requireCurrentUserPage();
  await revokePageMcpToken(current.page.id);
  revalidatePath("/settings");
  settingsSaved("mcp-revoked");
}
