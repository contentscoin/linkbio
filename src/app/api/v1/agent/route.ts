import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { links, pages } from "@/db/schema";
import { assertPageScopedHandle, authenticateMcpRequest } from "@/lib/mcp-auth";
import {
  getPageByHandle,
  getPageLinks,
  summarizePageBundle,
} from "@/lib/page-bundle";
import { enforceRateLimit } from "@/lib/ratelimit";
import {
  displayNameSchema,
  handleSchema,
  initialsFromName,
  urlSchema,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

async function gate(request: NextRequest) {
  const auth = await authenticateMcpRequest(request);
  if (!auth.ok) return auth;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const allowed = await enforceRateLimit(`mcp:agent:${ip}`, 120, 60_000);
  if (!allowed) {
    return { ok: false as const, status: 429, error: "Rate limit exceeded." };
  }
  return auth;
}

function parseHandle(raw: unknown) {
  return handleSchema.safeParse(typeof raw === "string" ? raw : "");
}

export async function GET(request: NextRequest) {
  const auth = await gate(request);
  if (!auth.ok) return jsonError(auth.status, auth.error);

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "page";

  if (action === "health") {
    return NextResponse.json({
      ok: true,
      service: "omo-bio-agent",
      scope: auth.scope,
    });
  }

  if (action === "page") {
    const handle = parseHandle(searchParams.get("handle"));
    if (!handle.success) {
      return jsonError(400, handle.error.issues[0]?.message ?? "Invalid handle.");
    }
    const scopeError = assertPageScopedHandle(auth, handle.data);
    if (scopeError) return jsonError(403, scopeError);

    const page = await getPageByHandle(handle.data);
    if (!page) return jsonError(404, "Page not found.");
    const pageLinks = await getPageLinks(page.id);
    return NextResponse.json({
      ok: true,
      page: summarizePageBundle(page, pageLinks),
    });
  }

  return jsonError(400, "Unknown action. Use action=page or action=health.");
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
  const handleResult = parseHandle(body.handle);
  if (!handleResult.success) {
    return jsonError(
      400,
      handleResult.error.issues[0]?.message ?? "Invalid handle.",
    );
  }

  const scopeError = assertPageScopedHandle(auth, handleResult.data);
  if (scopeError) return jsonError(403, scopeError);

  const page = await getPageByHandle(handleResult.data);
  if (!page) return jsonError(404, "Page not found.");

  const db = getDb();

  switch (action) {
    case "update_profile": {
      const patch: Partial<typeof pages.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (typeof body.displayName === "string") {
        const name = displayNameSchema.safeParse(body.displayName);
        if (!name.success) {
          return jsonError(
            400,
            name.error.issues[0]?.message ?? "Invalid displayName.",
          );
        }
        patch.displayName = name.data;
        const initials = initialsFromName(name.data);
        patch.avatarText = initials;
        patch.avatarInitials = initials;
      }
      if (typeof body.bio === "string") {
        patch.bio = body.bio.slice(0, 280);
      }
      if (typeof body.theme === "string") {
        patch.theme = body.theme.slice(0, 32);
      }
      if (typeof body.accent === "string") {
        patch.accent = body.accent.slice(0, 32);
      }
      if (typeof body.isPublished === "boolean") {
        patch.published = body.isPublished;
        patch.isPublished = body.isPublished;
      }
      if (typeof body.published === "boolean") {
        patch.published = body.published;
        patch.isPublished = body.published;
      }
      if (body.design && typeof body.design === "object" && !Array.isArray(body.design)) {
        const incoming = body.design as Record<string, unknown>;
        const next: Record<string, string> = {
          ...(page.design && typeof page.design === "object" && !Array.isArray(page.design)
            ? Object.fromEntries(
                Object.entries(page.design).filter(
                  (entry): entry is [string, string] =>
                    typeof entry[0] === "string" && typeof entry[1] === "string",
                ),
              )
            : {}),
        };
        const keys = [
          "layout",
          "pattern",
          "motion",
          "effect",
          "card",
          "size",
          "radius",
          "font",
          "effectCard",
        ] as const;
        for (const key of keys) {
          const value = incoming[key];
          if (value === null) {
            delete next[key];
            continue;
          }
          if (typeof value === "string" && value.trim()) {
            next[key] = value.trim().slice(0, 32);
          }
        }
        patch.design = next;
      }
      await db.update(pages).set(patch).where(eq(pages.id, page.id));
      break;
    }
    case "upsert_link": {
      const label =
        typeof body.label === "string" ? body.label.trim().slice(0, 80) : "";
      const url = urlSchema.safeParse(body.url);
      if (!label) return jsonError(400, "Invalid label.");
      if (!url.success) {
        return jsonError(400, url.error.issues[0]?.message ?? "Invalid URL.");
      }
      const sublabel =
        typeof body.sublabel === "string"
          ? body.sublabel.trim().slice(0, 160)
          : "";
      const featured = body.featured === true;
      const visible = body.isVisible !== false && body.visible !== false;
      const section =
        typeof body.section === "string" ? body.section.trim().slice(0, 40) : undefined;

      if (typeof body.linkId === "string" && body.linkId) {
        await db
          .update(links)
          .set({
            label,
            sublabel,
            url: url.data,
            featured,
            visible,
            isVisible: visible,
            ...(section !== undefined ? { section } : {}),
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
        const sortOrder = (last?.sortOrder ?? -1) + 1;
        await db.insert(links).values({
          pageId: page.id,
          label,
          sublabel,
          url: url.data,
          featured,
          visible,
          isVisible: visible,
          section: section ?? "",
          sortOrder,
          position: sortOrder,
        });
      }
      break;
    }
    case "delete_link": {
      if (typeof body.linkId !== "string" || !body.linkId) {
        return jsonError(400, "linkId required.");
      }
      await db
        .delete(links)
        .where(and(eq(links.id, body.linkId), eq(links.pageId, page.id)));
      break;
    }
    default:
      return jsonError(
        400,
        "Unknown action. Use update_profile, upsert_link, or delete_link.",
      );
  }

  const fresh = (await getPageByHandle(handleResult.data)) ?? page;
  const pageLinks = await getPageLinks(fresh.id);
  return NextResponse.json({
    ok: true,
    page: summarizePageBundle(fresh, pageLinks),
  });
}
