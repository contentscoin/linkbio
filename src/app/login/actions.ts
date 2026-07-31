"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { redirectWithMessage } from "@/lib/messages";
import { checkRateLimit } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/request";
import { createSession, deleteSession } from "@/lib/session";
import { validateEmail } from "@/lib/validation";

const dummyHash = "$2b$12$ER8nKhSzB9/36v7.HwEfQ.dhR6ORVLHYE0od.0FwvZEipHpZHDora";
const authWindowMs = 10 * 60 * 1000;

function fail(message: string): never {
  redirect(redirectWithMessage("/login", "error", message));
}

export async function loginAction(formData: FormData) {
  const ip = await getClientIp();
  if (!checkRateLimit(`login:${ip}`, 20, authWindowMs)) {
    fail("Too many login attempts. Try again later.");
  }

  const email = validateEmail(formData.get("email"));
  if (!email.ok) fail("Email or password is incorrect.");

  const password = String(formData.get("password") ?? "");
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.value))
    .limit(1);

  const passwordHash = user?.passwordHash ?? dummyHash;
  const matches = await bcrypt.compare(password, passwordHash);
  if (!user || !matches) {
    fail("Email or password is incorrect.");
  }

  await createSession(user.id);
  redirect("/admin");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
