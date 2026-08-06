"use server";

import { redirect } from "next/navigation";
import { authenticateWithPassword } from "@/lib/authenticate";
import { deleteSession } from "@/lib/session";

export type LoginState = {
  message?: string;
  errors?: {
    email?: string;
    password?: string;
  };
};

/** Kept for compatibility; UI posts to `/api/auth/login`. */
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

  const result = await authenticateWithPassword(
    String(formData.get("email") ?? ""),
    String(formData.get("password") ?? ""),
  );

  if (!result.ok) {
    return {
      message: result.message,
      errors: result.field
        ? { [result.field]: result.message }
        : undefined,
    };
  }

  redirect("/settings");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
