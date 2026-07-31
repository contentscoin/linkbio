import "server-only";

import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { validateSessionSecret } from "./validation";

const cookieName = "linkbio_session";
const sessionDays = 30;

type SessionPayload = {
  userId: string;
};

function getSecretKey() {
  const result = validateSessionSecret(process.env.SESSION_SECRET);
  if (!result.ok) {
    throw new Error(result.message);
  }
  return new TextEncoder().encode(result.value);
}

export async function createSession(userId: string) {
  const expires = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${sessionDays}d`)
    .sign(getSecretKey());

  const store = await cookies();
  store.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, getSecretKey());
    if (typeof verified.payload.userId !== "string") {
      return null;
    }
    return { userId: verified.payload.userId };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const store = await cookies();
  store.delete(cookieName);
}
