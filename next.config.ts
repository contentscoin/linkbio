import type { NextConfig } from "next";
import { FRAME_ANCESTORS } from "./src/lib/embed-origins";

/**
 * Allow ChatGPT / Claude MCP Apps hosts to embed /designer when needed.
 * Widget CSP still prefers a self-contained UI (no nested iframe).
 *
 * The origin list lives in src/lib/embed-origins.ts so this CSP and the
 * designer's postMessage checks cannot drift apart.
 */
const frameAncestors = FRAME_ANCESTORS;

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/designer",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${frameAncestors}`,
          },
        ],
      },
      {
        source: "/designer/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${frameAncestors}`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
