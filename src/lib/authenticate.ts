import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/session";
import { clientIpFromHeaders, enforceRateLimit } from "@/lib/ratelimit";
import { emailSchema } from "@/lib/validation";

export type LoginResult =
  | { ok: true }
  | { ok: false; message: string; field?: "email" | "password" };

const THROTTLED = "로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요.";

/** Per-IP first (cheapest gate), then per-account so a botnet cannot spread
 *  a brute force for one email across many addresses. */
const IP_ATTEMPTS = 10;
const IP_WINDOW_MS = 5 * 60_000;
const EMAIL_ATTEMPTS = 5;
const EMAIL_WINDOW_MS = 15 * 60_000;

export async function authenticateWithPassword(
  emailRaw: string,
  passwordRaw: string,
): Promise<LoginResult> {
  // Throttle before any bcrypt work: cost-12 hashing is exactly the thing an
  // attacker wants to make us do repeatedly.
  const ip = clientIpFromHeaders(await headers());
  if (!(await enforceRateLimit(`auth:login:ip:${ip}`, IP_ATTEMPTS, IP_WINDOW_MS))) {
    return { ok: false, message: THROTTLED };
  }

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

  const emailKey = `auth:login:email:${emailParsed.data.toLowerCase()}`;
  if (!(await enforceRateLimit(emailKey, EMAIL_ATTEMPTS, EMAIL_WINDOW_MS))) {
    return { ok: false, message: THROTTLED };
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
