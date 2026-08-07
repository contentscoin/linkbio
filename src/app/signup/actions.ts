"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { pages, users } from "@/db/schema";
import { createSession } from "@/lib/session";
import { clientIpFromHeaders, enforceRateLimit } from "@/lib/ratelimit";
import {
  displayNameSchema,
  emailSchema,
  handleSchema,
  initialsFromName,
  passwordSchema,
} from "@/lib/validation";

const SIGNUP_ATTEMPTS = 5;
const SIGNUP_WINDOW_MS = 60 * 60_000;

export async function signupAction(formData: FormData) {
  // Bounds both account-farming and the cost-12 bcrypt hash below.
  const ip = clientIpFromHeaders(await headers());
  const allowed = await enforceRateLimit(
    `auth:signup:ip:${ip}`,
    SIGNUP_ATTEMPTS,
    SIGNUP_WINDOW_MS,
  );
  if (!allowed) {
    redirect(
      "/signup?error=" +
        encodeURIComponent("가입 시도가 너무 많습니다. 잠시 후 다시 시도하세요."),
    );
  }

  const email = emailSchema.safeParse(formData.get("email"));
  const password = passwordSchema.safeParse(formData.get("password"));
  const handle = handleSchema.safeParse(formData.get("handle"));
  const displayName = displayNameSchema.safeParse(formData.get("displayName"));

  if (!email.success) {
    redirect("/signup?error=" + encodeURIComponent(email.error.issues[0]?.message ?? "이메일을 확인하세요."));
  }
  if (!password.success) {
    redirect("/signup?error=" + encodeURIComponent(password.error.issues[0]?.message ?? "비밀번호를 확인하세요."));
  }
  if (!handle.success) {
    redirect("/signup?error=" + encodeURIComponent(handle.error.issues[0]?.message ?? "주소를 확인하세요."));
  }
  if (!displayName.success) {
    redirect("/signup?error=" + encodeURIComponent(displayName.error.issues[0]?.message ?? "이름을 확인하세요."));
  }

  const db = getDb();
  const [existingEmail] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.data))
    .limit(1);
  if (existingEmail) {
    redirect("/signup?error=" + encodeURIComponent("이미 가입된 이메일입니다."));
  }

  const [existingHandle] = await db
    .select({ id: pages.id })
    .from(pages)
    .where(eq(pages.handle, handle.data))
    .limit(1);
  if (existingHandle) {
    redirect("/signup?error=" + encodeURIComponent("이미 사용 중인 주소입니다."));
  }

  const passwordHash = await bcrypt.hash(password.data, 12);
  const [user] = await db
    .insert(users)
    .values({ email: email.data, passwordHash })
    .returning();

  if (!user) {
    redirect("/signup?error=" + encodeURIComponent("가입에 실패했습니다. 다시 시도하세요."));
  }

  const initials = initialsFromName(displayName.data);
  await db.insert(pages).values({
    userId: user.id,
    handle: handle.data,
    displayName: displayName.data,
    bio: "",
    avatarText: initials,
    avatarInitials: initials,
    theme: "fairway",
    accent: "",
    published: true,
    isPublished: true,
  });

  await createSession(user.id);
  redirect("/settings");
}
