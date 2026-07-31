import "server-only";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { pages, users } from "@/db/schema";
import { readSession } from "./session";

export async function getCurrentUserPage() {
  const session = await readSession();
  if (!session) {
    return null;
  }

  const db = getDb();
  const [row] = await db
    .select({
      user: users,
      page: pages,
    })
    .from(users)
    .innerJoin(pages, eq(pages.userId, users.id))
    .where(eq(users.id, session.userId))
    .limit(1);

  return row ?? null;
}

export async function requireCurrentUserPage() {
  const current = await getCurrentUserPage();
  if (!current) {
    redirect("/login");
  }
  return current;
}
