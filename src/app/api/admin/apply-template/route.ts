import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { applyDesignTemplateToPage } from "@/lib/apply-design-template";
import { requireUserPage } from "@/lib/current";

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

function adminRedirect(request: Request, query: Record<string, string>) {
  const url = new URL("/admin", request.url);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url, 303);
}

/**
 * Classic form POST — avoids Next.js Server Action ID rotation
 * (UnrecognizedActionError after deploys).
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return adminRedirect(request, {
      error: "잘못된 요청입니다. 새로고침 후 다시 시도하세요.",
    });
  }

  const { page } = await requireUserPage();
  const formData = await request.formData();
  const templateId = String(formData.get("templateId") ?? "");
  const accent = String(formData.get("accent") ?? "");

  const result = await applyDesignTemplateToPage(page, templateId, accent);
  if (!result.ok) {
    return adminRedirect(request, { error: result.error });
  }

  revalidatePath(`/${result.handle}`);
  revalidatePath("/admin");
  return adminRedirect(request, { saved: "design" });
}
