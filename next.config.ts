import type { NextConfig } from "next";

/**
 * Allow ChatGPT / Claude MCP Apps hosts to embed /designer when needed.
 * Widget CSP still prefers a self-contained UI (no nested iframe).
 */
const frameAncestors = [
  "'self'",
  "https://chatgpt.com",
  "https://*.chatgpt.com",
  "https://chat.openai.com",
  "https://*.oaiusercontent.com",
  "https://claude.ai",
  "https://*.claude.ai",
].join(" ");

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
