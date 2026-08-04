"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, Plug, RefreshCw, Trash2 } from "lucide-react";
import {
  issueMcpTokenAction,
  revokeMcpTokenAction,
} from "@/app/settings/actions";

type McpConnectPanelProps = {
  handle: string;
  hasToken: boolean;
  tokenPrefix: string | null;
  tokenCreatedAt: Date | null;
  issuedToken?: string | null;
  agentUrl: string;
  publicPageUrl: string;
};

function formatDate(value: Date | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function CopyField({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="field">
      <div className="mcp-field-head">
        <label>{label}</label>
        <button className="button secondary compact" type="button" onClick={copy}>
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "복사됨" : "복사"}
        </button>
      </div>
      {multiline ? (
        <pre className="code-block">{value}</pre>
      ) : (
        <input className="input" readOnly value={value} />
      )}
    </div>
  );
}

export function McpConnectPanel({
  handle,
  hasToken,
  tokenPrefix,
  tokenCreatedAt,
  issuedToken,
  agentUrl,
  publicPageUrl,
}: McpConnectPanelProps) {
  const tokenPlaceholder = "<발급받은-개인-토큰>";
  const tokenForSnippets = issuedToken || tokenPlaceholder;
  const mcpJson = JSON.stringify(
    {
      mcpServers: {
        [`linkbio-${handle}`]: {
          type: "stdio",
          command: "node",
          args: ["mcp/run.mjs"],
          env: {
            LINKBIO_BASE_URL: agentUrl.replace(/\/api\/v1\/agent$/, ""),
            MCP_API_KEY: tokenForSnippets,
            NODE_PATH: "./node_modules",
          },
        },
      },
    },
    null,
    2,
  );
  const curlExample = [
    `# 내 페이지 조회`,
    `curl -H "Authorization: Bearer ${tokenForSnippets}" \\`,
    `  "${agentUrl}?action=page&handle=${handle}"`,
    ``,
    `# 템플릿 목록`,
    `curl -H "Authorization: Bearer ${tokenForSnippets}" \\`,
    `  "${agentUrl}?action=templates"`,
  ].join("\n");

  return (
    <section className="form-card mcp-connect stack">
      <div>
        <p className="eyebrow">
          <Plug size={14} /> MCP 연결
        </p>
        <h2>에이전트 · API 연결 가이드</h2>
        <p className="small muted">
          Cursor 등 MCP 클라이언트나 HTTP로 <strong>@{handle}</strong> 페이지만
          조회·수정할 수 있는 개인 연결 정보입니다.
        </p>
      </div>

      <ol className="mcp-steps">
        <li>아래에서 <strong>API URL</strong>과 <strong>개인 토큰</strong>을 복사합니다.</li>
        <li>Cursor Settings → Tools &amp; MCP에 <code>mcp.json</code> 내용을 붙여넣습니다.</li>
        <li>Cursor를 재시작한 뒤 <code>get_page</code> / <code>list_templates</code> 등으로 확인합니다.</li>
      </ol>

      <CopyField label="API URL (Agent endpoint)" value={agentUrl} />
      <CopyField label="내 공개 페이지" value={publicPageUrl} />
      <CopyField label="Handle" value={handle} />

      <div className="field">
        <label>개인 MCP 토큰</label>
        <input
          className="input"
          readOnly
          value={issuedToken ?? (tokenPrefix ? `${tokenPrefix}…` : "아직 발급되지 않음")}
        />
        {issuedToken ? (
          <p className="small warn-line">
            <KeyRound size={14} /> 이 토큰은 지금만 전체 표시됩니다. 안전한 곳에 복사하세요.
          </p>
        ) : tokenCreatedAt ? (
          <p className="small muted">발급됨 · {formatDate(tokenCreatedAt)}</p>
        ) : (
          <p className="small muted">발급 버튼을 누르면 토큰이 한 번 표시됩니다.</p>
        )}
      </div>

      <div className="button-row">
        <form action={issueMcpTokenAction}>
          <button className="button primary" type="submit">
            <RefreshCw size={16} />
            {hasToken ? "토큰 재발급" : "토큰 발급"}
          </button>
        </form>
        {hasToken ? (
          <form action={revokeMcpTokenAction}>
            <button className="button secondary" type="submit">
              <Trash2 size={16} />
              토큰 폐기
            </button>
          </form>
        ) : null}
      </div>

      {issuedToken ? <CopyField label="토큰 (전체)" value={issuedToken} /> : null}

      <CopyField label="Cursor mcp.json" value={mcpJson} multiline />
      <CopyField label="curl 예시" value={curlExample} multiline />

      <p className="small muted">
        Cursor 설정은 프로젝트 루트의 <code>mcp/run.mjs</code> 경로(또는 절대 경로)를
        사용합니다. 개인 토큰은 내 페이지만 접근할 수 있으며, 다른 handle는 403입니다.
      </p>
    </section>
  );
}
