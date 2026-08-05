import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { pages, users } from "@/db/schema";
import { getSessionUserId } from "@/lib/session";

export async function requireUserPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    redirect("/login");
  }

  const [page] = await db
    .select()
    .from(pages)
    .where(eq(pages.userId, user.id))
    .limit(1);

  if (!page) {
    redirect("/signup");
  }

  return { user, page };
}
