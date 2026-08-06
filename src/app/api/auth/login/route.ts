import { NextResponse } from "next/server";
import { authenticateWithPassword } from "@/lib/authenticate";

function sameOrigin(request: Request): boolean {
  const url = new URL(request.url);
  const hostHeader =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    url.host;
  const host = hostHeader.split(",")[0]?.trim() || url.host;

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }
  const referer = request.headers.get("referer");
  if (!referer) return true;
  try {
    return new URL(referer).host === host;
  } catch {
    return false;
  }
}

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

/**
 * Classic form POST — avoids Server Action ID rotation breaking login
 * after deploys (UnrecognizedActionError).
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return redirectTo(
      request,
      "/login?error=" +
        encodeURIComponent("잘못된 요청입니다. 새로고침 후 다시 시도하세요."),
    );
  }

  const formData = await request.formData();
  const result = await authenticateWithPassword(
    String(formData.get("email") ?? ""),
    String(formData.get("password") ?? ""),
  );

  if (!result.ok) {
    return redirectTo(
      request,
      "/login?error=" + encodeURIComponent(result.message),
    );
  }

  return redirectTo(request, "/settings");
}
