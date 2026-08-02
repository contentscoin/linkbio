import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { links, pages } from "@/db/schema";
import { requireMcpAuth } from "@/lib/mcp-auth";
import {
  applyTemplateToPage,
  getOwnedPageByHandle,
  getPageBundle,
  importSocialChannel,
  summarizePageBundle,
  updatePageDesign,
} from "@/lib/page-service";
import { enforceRateLimit } from "@/lib/ratelimit";
import { TEMPLATE_IDS, templates, type PageDesign } from "@/lib/templates";
import { sanitizeCustomCss } from "@/lib/design";
import {
  validateExternalUrl,
  validateHandle,
  validateTheme,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

async function gate(request: NextRequest) {
  const auth = requireMcpAuth(request);
  if (!auth.ok) return auth;
  const allowed = await enforceRateLimit("mcp:agent", 120, 60_000);
  if (!allowed) {
    return { ok: false as const, status: 429, error: "Rate limit exceeded." };
  }
  return { ok: true as const };
}

export async function GET(request: NextRequest) {
  const auth = await gate(request);
  if (!auth.ok) return jsonError(auth.status, auth.error);

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "templates";

  if (action === "templates") {
    return NextResponse.json({
      ok: true,
      templates: TEMPLATE_IDS.map((id) => ({
        id,
        name: templates[id].name,
        description: templates[id].description,
        design: templates[id].design,
      })),
    });
  }

  if (action === "page") {
    const handle = validateHandle(searchParams.get("handle"));
    if (!handle.ok) return jsonError(400, handle.message);
    const page = await getOwnedPageByHandle(handle.value);
    if (!page) return jsonError(404, "Page not found.");
    const bundle = await getPageBundle(page);
    return NextResponse.json({ ok: true, page: summarizePageBundle(bundle) });
  }

  return jsonError(400, "Unknown action.");
}

export async function POST(request: NextRequest) {
  const auth = await gate(request);
  if (!auth.ok) return jsonError(auth.status, auth.error);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  const action = typeof body.action === "string" ? body.action : "";
  const handleResult = validateHandle(typeof body.handle === "string" ? body.handle : "");
  if (!handleResult.ok) return jsonError(400, handleResult.message);

  const page = await getOwnedPageByHandle(handleResult.value);
  if (!page) return jsonError(404, "Page not found.");

  switch (action) {
    case "apply_template": {
      const theme = validateTheme(typeof body.theme === "string" ? body.theme : "");
      if (!theme.ok) return jsonError(400, theme.message);
      await applyTemplateToPage(page.id, theme.value);
      break;
    }
    case "update_design": {
      const design = body.design as Partial<PageDesign> | undefined;
      if (!design || typeof design !== "object") {
        return jsonError(400, "design object is required.");
      }
      const current = await getPageBundle(page);
      const merged: PageDesign = {
        ...current.design,
        ...design,
        customCss: sanitizeCustomCss(
          typeof design.customCss === "string" ? design.customCss : current.design.customCss,
        ),
      };
      await updatePageDesign(page.id, merged);
      break;
    }
    case "update_profile": {
      const patch: Partial<typeof pages.$inferInsert> = { updatedAt: new Date() };
      if (typeof body.displayName === "string") patch.displayName = body.displayName.slice(0, 80);
      if (typeof body.bio === "string") patch.bio = body.bio.slice(0, 280);
      if (typeof body.contactEmail === "string") {
        patch.contactEmail = body.contactEmail.slice(0, 320);
      }
      if (typeof body.isPublished === "boolean") patch.isPublished = body.isPublished;
      if (typeof body.showShare === "boolean") patch.showShare = body.showShare;
      if (typeof body.showContact === "boolean") patch.showContact = body.showContact;
      await getDb().update(pages).set(patch).where(eq(pages.id, page.id));
      break;
    }
    case "import_social": {
      const url = validateExternalUrl(typeof body.url === "string" ? body.url : "");
      if (!url.ok) return jsonError(400, url.message);
      try {
        await importSocialChannel(page.id, url.value);
      } catch (error) {
        return jsonError(
          400,
          error instanceof Error ? error.message : "Import failed.",
        );
      }
      break;
    }
    case "upsert_link": {
      const label = typeof body.label === "string" ? body.label.trim() : "";
      const url = validateExternalUrl(typeof body.url === "string" ? body.url : "");
      if (!label || label.length > 80) return jsonError(400, "Invalid label.");
      if (!url.ok) return jsonError(400, url.message);
      const db = getDb();
      if (typeof body.linkId === "string") {
        await db
          .update(links)
          .set({
            label,
            url: url.value,
            isVisible: body.isVisible !== false,
            updatedAt: new Date(),
          })
          .where(and(eq(links.id, body.linkId), eq(links.pageId, page.id)));
      } else {
        const [last] = await db
          .select({ sortOrder: links.sortOrder })
          .from(links)
          .where(eq(links.pageId, page.id))
          .orderBy(desc(links.sortOrder))
          .limit(1);
        await db.insert(links).values({
          pageId: page.id,
          label,
          url: url.value,
          sortOrder: (last?.sortOrder ?? -1) + 1,
        });
      }
      break;
    }
    case "delete_link": {
      if (typeof body.linkId !== "string") return jsonError(400, "linkId required.");
      await getDb()
        .delete(links)
        .where(and(eq(links.id, body.linkId), eq(links.pageId, page.id)));
      break;
    }
    default:
      return jsonError(400, "Unknown action.");
  }

  const bundle = await getPageBundle(
    (await getOwnedPageByHandle(handleResult.value)) ?? page,
  );
  return NextResponse.json({ ok: true, page: summarizePageBundle(bundle) });
}
