"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, Plug, RefreshCw, Trash2 } from "lucide-react";
import { issueMcpTokenAction, revokeMcpTokenAction } from "@/app/admin/actions";

type McpConnectPanelProps = {
  handle: string;
  hasToken: boolean;
  tokenPrefix: string | null;
  tokenCreatedAt: Date | null;
  issuedToken?: string;
  baseUrl: string;
};

function formatDate(value: Date | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function CopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button className="button secondary" type="button" onClick={copy}>
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? "Copied" : label}
    </button>
  );
}

export function McpConnectPanel({
  handle,
  hasToken,
  tokenPrefix,
  tokenCreatedAt,
  issuedToken,
  baseUrl,
}: McpConnectPanelProps) {
  const endpoint = `${baseUrl}/api/v1/agent`;
  const mcpJson = JSON.stringify(
    {
      mcpServers: {
        linkbio: {
          type: "stdio",
          command: "node",
          args: ["./mcp/run.mjs"],
          env: {
            LINKBIO_BASE_URL: baseUrl,
            MCP_API_KEY: issuedToken || "<your-lbmcp-token>",
          },
        },
      },
    },
    null,
    2,
  );
  const curlExample = `curl -H "Authorization: Bearer ${issuedToken || "<your-lbmcp-token>"}" \\
  "${endpoint}?action=page&handle=${handle}"`;

  return (
    <div className="form-card stack">
      <div>
        <p className="eyebrow">
          <Plug size={14} /> MCP connect
        </p>
        <h2>Cursor / agent access</h2>
        <p className="small muted">
          Issue a personal token scoped to <strong>@{handle}</strong>. Use it in Cursor MCP or
          direct HTTP calls instead of the global server key.
        </p>
      </div>

      {issuedToken ? (
        <div className="mcp-token-reveal">
          <p className="small">
            <KeyRound size={14} /> Copy this token now — it will not be shown again.
          </p>
          <code className="code-block">{issuedToken}</code>
          <CopyButton label="Copy token" value={issuedToken} />
        </div>
      ) : null}

      <div className="mcp-status-row">
        {hasToken ? (
          <p className="small">
            Active token: <code>{tokenPrefix}…</code>
            {tokenCreatedAt ? ` · issued ${formatDate(tokenCreatedAt)}` : null}
          </p>
        ) : (
          <p className="small muted">No personal MCP token issued yet.</p>
        )}
      </div>

      <div className="button-row">
        <form action={issueMcpTokenAction}>
          <button className="button primary" type="submit">
            <RefreshCw size={17} />
            {hasToken ? "Rotate token" : "Issue token"}
          </button>
        </form>
        {hasToken ? (
          <form action={revokeMcpTokenAction}>
            <button className="button danger" type="submit">
              <Trash2 size={17} />
              Revoke
            </button>
          </form>
        ) : null}
      </div>

      <div className="stack">
        <div className="field">
          <label>Agent endpoint</label>
          <code className="code-block">{endpoint}</code>
          <CopyButton label="Copy endpoint" value={endpoint} />
        </div>
        <div className="field">
          <label>Cursor mcp.json snippet</label>
          <pre className="code-block">{mcpJson}</pre>
          <CopyButton label="Copy mcp.json" value={mcpJson} />
        </div>
        <div className="field">
          <label>curl example</label>
          <pre className="code-block">{curlExample}</pre>
          <CopyButton label="Copy curl" value={curlExample} />
        </div>
      </div>
    </div>
  );
}
