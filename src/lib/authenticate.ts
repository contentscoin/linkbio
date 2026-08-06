import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/session";
import { emailSchema } from "@/lib/validation";

export type LoginResult =
  | { ok: true }
  | { ok: false; message: string; field?: "email" | "password" };

export async function authenticateWithPassword(
  emailRaw: string,
  passwordRaw: string,
): Promise<LoginResult> {
  const emailParsed = emailSchema.safeParse(emailRaw);
  const password = String(passwordRaw ?? "");

  if (!emailParsed.success) {
    return {
      ok: false,
      message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      field: "email",
    };
  }

  if (!password) {
    return {
      ok: false,
      message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      field: "password",
    };
  }

  try {
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
      return { ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." };
    }

    await createSession(user.id);
    return { ok: true };
  } catch (error) {
    console.error("authenticateWithPassword failed", error);
    return {
      ok: false,
      message: "로그인에 실패했습니다. 잠시 후 다시 시도하세요.",
    };
  }
}
