"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createSession, deleteSession } from "@/lib/session";
import { emailSchema } from "@/lib/validation";

export async function loginAction(formData: FormData) {
  const emailParsed = emailSchema.safeParse(formData.get("email"));
  const password = String(formData.get("password") ?? "");

  if (!emailParsed.success) {
    redirect("/login?error=" + encodeURIComponent("이메일 또는 비밀번호가 올바르지 않습니다."));
  }

  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, emailParsed.data))
    .limit(1);

  const dummy =
    "$2b$12$ER8nKhSzB9/36v7.HwEfQ.dhR6ORVLHYE0od.0FwvZEipHpZHDora";
  const ok = await bcrypt.compare(password, user?.passwordHash ?? dummy);
  if (!user || !ok) {
    redirect("/login?error=" + encodeURIComponent("이메일 또는 비밀번호가 올바르지 않습니다."));
  }

  await createSession(user.id);
  redirect("/settings");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
