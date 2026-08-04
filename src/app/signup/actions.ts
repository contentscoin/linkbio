"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { pages, users } from "@/db/schema";
import { redirectWithMessage } from "@/lib/messages";
import { enforceRateLimit } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/request";
import { createSession } from "@/lib/session";
import {
  validateDisplayName,
  validateEmail,
  validateHandle,
  validatePassword,
} from "@/lib/validation";

const authWindowMs = 10 * 60 * 1000;

function fail(message: string): never {
  redirect(redirectWithMessage("/signup", "error", message));
}

export async function signupAction(formData: FormData) {
  const ip = await getClientIp();
  if (!(await enforceRateLimit(`signup:${ip}`, 12, authWindowMs))) {
    fail("Too many signup attempts. Try again later.");
  }

  const email = validateEmail(formData.get("email"));
  if (!email.ok) fail(email.message);

  const password = validatePassword(formData.get("password"));
  if (!password.ok) fail(password.message);

  const handle = validateHandle(formData.get("handle"));
  if (!handle.ok) fail(handle.message);

  const displayName = validateDisplayName(formData.get("displayName"));
  if (!displayName.ok) fail(displayName.message);

  const db = getDb();
  const [existingEmail] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.value))
    .limit(1);
  if (existingEmail) {
    fail("That email is already registered.");
  }

  const [existingHandle] = await db
    .select({ id: pages.id })
    .from(pages)
    .where(eq(pages.handle, handle.value))
    .limit(1);
  if (existingHandle) {
    fail("That handle is already taken.");
  }

  const passwordHash = await bcrypt.hash(password.value, 12);
  const [user] = await db
    .insert(users)
    .values({ email: email.value, passwordHash })
    .returning({ id: users.id });

  if (!user) {
    fail("Could not create the account.");
  }

  try {
    await db.insert(pages).values({
      userId: user.id,
      handle: handle.value,
      displayName: displayName.value,
      avatarInitials: displayName.value.slice(0, 2).toUpperCase(),
    });
  } catch {
    await db.delete(users).where(eq(users.id, user.id));
    fail("Could not create the page. Try a different handle.");
  }

  await createSession(user.id);
  redirect("/settings");
}
