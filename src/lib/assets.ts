import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { assets } from "@/db/schema";
import { siteOrigin } from "@/lib/site-url";

const MAX_BYTES = 1_500_000;
const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

export type UploadedAsset = {
  id: string;
  url: string;
  mimeType: string;
  byteSize: number;
};

function normalizeMime(mime: string) {
  const m = mime.trim().toLowerCase();
  if (m === "image/jpg") return "image/jpeg";
  return m;
}

export function parseDataUri(input: string): {
  mimeType: string;
  buffer: Buffer;
} | null {
  const trimmed = input.trim();
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/i.exec(trimmed);
  if (!match) return null;
  const mimeType = normalizeMime(match[1] || "");
  if (!ALLOWED.has(mimeType)) return null;
  try {
    const buffer = Buffer.from(match[2].replace(/\s+/g, ""), "base64");
    if (!buffer.length || buffer.length > MAX_BYTES) return null;
    return { mimeType, buffer };
  } catch {
    return null;
  }
}

export function parseBase64Payload(
  raw: string,
  mimeTypeHint?: string,
): { mimeType: string; buffer: Buffer } | null {
  const mimeType = normalizeMime(mimeTypeHint || "image/png");
  if (!ALLOWED.has(mimeType)) return null;
  try {
    const buffer = Buffer.from(raw.replace(/\s+/g, ""), "base64");
    if (!buffer.length || buffer.length > MAX_BYTES) return null;
    return { mimeType, buffer };
  } catch {
    return null;
  }
}

export function assetPublicUrl(id: string, base?: string) {
  const origin = (base || siteOrigin()).replace(/\/$/, "");
  return `${origin}/api/assets/${id}`;
}

export async function storePageAsset(input: {
  pageId: string;
  mimeType: string;
  buffer: Buffer;
  purpose?: string;
}): Promise<UploadedAsset> {
  const mimeType = normalizeMime(input.mimeType);
  if (!ALLOWED.has(mimeType)) {
    throw new Error("지원 이미지: png, jpeg, webp, gif, svg");
  }
  if (input.buffer.length > MAX_BYTES) {
    throw new Error(`이미지는 ${MAX_BYTES}바이트 이하여야 합니다.`);
  }
  const [row] = await getDb()
    .insert(assets)
    .values({
      pageId: input.pageId,
      mimeType,
      contentBase64: input.buffer.toString("base64"),
      byteSize: input.buffer.length,
      purpose: (input.purpose || "general").slice(0, 32),
    })
    .returning({ id: assets.id });
  if (!row) throw new Error("자산 저장 실패");
  return {
    id: row.id,
    url: assetPublicUrl(row.id),
    mimeType,
    byteSize: input.buffer.length,
  };
}

export async function getAssetById(id: string) {
  const [row] = await getDb()
    .select()
    .from(assets)
    .where(eq(assets.id, id))
    .limit(1);
  return row ?? null;
}
