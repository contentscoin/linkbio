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
  width?: number;
  height?: number;
};

function normalizeMime(mime: string) {
  const m = mime.trim().toLowerCase();
  if (m === "image/jpg") return "image/jpeg";
  return m;
}

/** Best-effort image dimension probe (png/jpeg/gif/webp/svg). */
export function readImageDimensions(
  buffer: Buffer,
  mimeType: string,
): { width?: number; height?: number } {
  try {
    if (mimeType === "image/png" && buffer.length >= 24) {
      if (buffer.toString("ascii", 1, 4) === "PNG") {
        return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
      }
    }
    if (mimeType === "image/gif" && buffer.length >= 10) {
      return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
    }
    if (mimeType === "image/jpeg") {
      let i = 2;
      while (i < buffer.length - 8) {
        if (buffer[i] !== 0xff) break;
        const marker = buffer[i + 1]!;
        const len = buffer.readUInt16BE(i + 2);
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8) {
          return {
            height: buffer.readUInt16BE(i + 5),
            width: buffer.readUInt16BE(i + 7),
          };
        }
        i += 2 + len;
      }
    }
    if (mimeType === "image/webp" && buffer.length >= 30) {
      if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
        const chunk = buffer.toString("ascii", 12, 16);
        if (chunk === "VP8 " && buffer.length >= 30) {
          return {
            width: buffer.readUInt16LE(26) & 0x3fff,
            height: buffer.readUInt16LE(28) & 0x3fff,
          };
        }
        if (chunk === "VP8X" && buffer.length >= 30) {
          return {
            width: 1 + buffer.readUIntLE(24, 3),
            height: 1 + buffer.readUIntLE(27, 3),
          };
        }
      }
    }
    if (mimeType === "image/svg+xml") {
      const text = buffer.toString("utf8").slice(0, 4000);
      const vb = /viewBox\s*=\s*["']?\s*([0-9.+\-eE]+)\s+([0-9.+\-eE]+)\s+([0-9.+\-eE]+)\s+([0-9.+\-eE]+)/i.exec(
        text,
      );
      if (vb) {
        return {
          width: Math.round(Number(vb[3])),
          height: Math.round(Number(vb[4])),
        };
      }
      const w = /width\s*=\s*["']?([0-9.]+)/i.exec(text);
      const h = /height\s*=\s*["']?([0-9.]+)/i.exec(text);
      if (w && h) {
        return {
          width: Math.round(Number(w[1])),
          height: Math.round(Number(h[1])),
        };
      }
    }
  } catch {
    /* ignore */
  }
  return {};
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
  const dims = readImageDimensions(input.buffer, mimeType);
  return {
    id: row.id,
    url: assetPublicUrl(row.id),
    mimeType,
    byteSize: input.buffer.length,
    width: dims.width,
    height: dims.height,
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
