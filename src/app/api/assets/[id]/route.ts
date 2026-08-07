import { NextRequest, NextResponse } from "next/server";
import { getAssetById } from "@/lib/assets";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const asset = await getAssetById(id);
  if (!asset) {
    return new NextResponse("Not found", { status: 404 });
  }
  const body = Buffer.from(asset.contentBase64, "base64");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Length": String(body.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      // SVG uploads are allowed, and navigating straight to an asset URL renders
      // it as a document on our own origin — where inline <script> would run.
      // `sandbox` (no allow-scripts) neutralizes that; browsers ignore CSP when
      // the response is consumed as an <img> subresource, so raster assets are
      // unaffected. nosniff stops a mislabeled asset being sniffed into HTML.
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
