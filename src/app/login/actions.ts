"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createSession, deleteSession } from "@/lib/session";
import { emailSchema } from "@/lib/validation";

export type LoginState = {
  message?: string;
  errors?: {
    email?: string;
    password?: string;
  };
};

/** useActionState: (prevState, formData). Also tolerates bare form action (FormData only). */
export async function loginAction(
  prev: LoginState | FormData,
  maybeFormData?: FormData,
): Promise<LoginState> {
  const formData =
    maybeFormData instanceof FormData
      ? maybeFormData
      : prev instanceof FormData
        ? prev
        : null;

  if (!formData) {
    return { message: "로그인에 실패했습니다. 잠시 후 다시 시도하세요." };
  }

  const emailParsed = emailSchema.safeParse(formData.get("email"));
  const password = String(formData.get("password") ?? "");

  if (!emailParsed.success) {
    return {
      message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      errors: {
        email: emailParsed.error.issues[0]?.message ?? "이메일을 확인하세요.",
      },
    };
  }

  if (!password) {
    return {
      message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      errors: { password: "비밀번호를 입력하세요." },
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
      return { message: "이메일 또는 비밀번호가 올바르지 않습니다." };
    }

    await createSession(user.id);
  } catch (error) {
    console.error("loginAction failed", error);
    return {
      message: "로그인에 실패했습니다. 잠시 후 다시 시도하세요.",
    };
  }

  redirect("/settings");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
