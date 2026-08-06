"use client";

import { useState } from "react";
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
  mcpUrl: string;
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
        <button className="btn btn--icon" type="button" onClick={copy}>
          {copied ? "복사됨" : "복사"}
        </button>
      </div>
      {multiline ? (
        <pre className="mcp-code">{value}</pre>
      ) : (
        <input type="text" readOnly value={value} />
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
  mcpUrl,
  publicPageUrl,
}: McpConnectPanelProps) {
  const tokenPlaceholder = "<발급받은-개인-토큰>";
  const tokenForSnippets = issuedToken || tokenPlaceholder;
  const mcpUrlWithToken = `${mcpUrl}?token=${tokenForSnippets}`;
  const baseUrl = agentUrl.replace(/\/api\/v1\/agent$/, "");

  const cursorRemoteJson = JSON.stringify(
    {
      mcpServers: {
        [`omo-bio-${handle}`]: {
          url: mcpUrlWithToken,
        },
      },
    },
    null,
    2,
  );

  const cursorStdioJson = JSON.stringify(
    {
      mcpServers: {
        [`omo-bio-${handle}`]: {
          type: "stdio",
          command: "node",
          args: ["mcp/run.mjs"],
          env: {
            LINKBIO_BASE_URL: baseUrl,
            MCP_API_KEY: tokenForSnippets,
          },
        },
      },
    },
    null,
    2,
  );

  const claudeDesktopJson = JSON.stringify(
    {
      mcpServers: {
        [`omo-bio-${handle}`]: {
          type: "http",
          url: mcpUrl,
          headers: {
            Authorization: `Bearer ${tokenForSnippets}`,
          },
        },
      },
    },
    null,
    2,
  );

  const claudeCodeCli = [
    `# Claude Code CLI`,
    `claude mcp add --transport http omo-bio-${handle} \\`,
    `  "${mcpUrl}" \\`,
    `  --header "Authorization: Bearer ${tokenForSnippets}"`,
    ``,
    `# 또는 URL에 토큰 포함`,
    `claude mcp add --transport http omo-bio-${handle} \\`,
    `  "${mcpUrlWithToken}"`,
  ].join("\n");

  const curlExample = [
    `# 내 페이지 조회`,
    `curl -H "Authorization: Bearer ${tokenForSnippets}" \\`,
    `  "${agentUrl}?action=page&handle=${handle}"`,
    ``,
    `# 프로필생성도우미 시작`,
    `curl -X POST -H "Authorization: Bearer ${tokenForSnippets}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"action":"start_profile_wizard","handle":"${handle}"}' \\`,
    `  "${agentUrl}"`,
    ``,
    `# 디자인 템플릿 적용`,
    `curl -X POST -H "Authorization: Bearer ${tokenForSnippets}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"action":"apply_design_template","handle":"${handle}","templateId":"noir-glass"}' \\`,
    `  "${agentUrl}"`,
  ].join("\n");

  return (
    <section className="panel mcp-connect">
      <h2>MCP · API 연결</h2>
      <p className="lede" style={{ marginBottom: 16 }}>
        Cursor · Claude · ChatGPT에서 <strong>/{handle}</strong> 페이지만
        조회·수정할 수 있는 개인 MCP URL과 토큰입니다.
      </p>

      <ol className="mcp-steps">
        <li>
          아래에서 <strong>개인 토큰</strong>을 발급·복사합니다.
        </li>
        <li>
          클라이언트별 가이드(Cursor / Claude / ChatGPT)에 MCP URL을
          붙여넣습니다.
        </li>
        <li>
          연결 후 <code>start_profile_wizard</code> 또는 프롬프트{" "}
          <code>profile_creation_helper</code>로 프로필을 완성합니다.
        </li>
      </ol>

      <CopyField label="MCP URL (원격 · Claude/GPT/Cursor)" value={mcpUrl} />
      <CopyField
        label="MCP URL + 토큰 (헤더 미지원 클라이언트용)"
        value={mcpUrlWithToken}
      />
      <CopyField label="REST Agent URL" value={agentUrl} />
      <CopyField label="내 공개 페이지" value={publicPageUrl} />
      <CopyField label="Handle" value={handle} />

      <div className="field">
        <label>개인 MCP 토큰</label>
        <input
          type="text"
          readOnly
          value={
            issuedToken ??
            (tokenPrefix ? `${tokenPrefix}…` : "아직 발급되지 않음")
          }
        />
        {issuedToken ? (
          <p className="err" style={{ color: "var(--green-deep)" }}>
            이 토큰은 지금만 전체 표시됩니다. 안전한 곳에 복사하세요.
          </p>
        ) : tokenCreatedAt ? (
          <p className="hint">발급됨 · {formatDate(tokenCreatedAt)}</p>
        ) : (
          <p className="hint">발급 버튼을 누르면 토큰이 한 번 표시됩니다.</p>
        )}
      </div>

      <div className="row" style={{ marginBottom: 16 }}>
        <form action={issueMcpTokenAction}>
          <button className="btn btn--primary" type="submit">
            {hasToken ? "토큰 재발급" : "토큰 발급"}
          </button>
        </form>
        {hasToken ? (
          <form action={revokeMcpTokenAction}>
            <button className="btn btn--danger" type="submit">
              토큰 폐기
            </button>
          </form>
        ) : null}
      </div>

      {issuedToken ? <CopyField label="토큰 (전체)" value={issuedToken} /> : null}

      <h3 className="mcp-guide-title">Cursor</h3>
      <ol className="mcp-steps">
        <li>Settings → Tools &amp; MCP → New MCP Server</li>
        <li>
          원격 URL 방식(권장): 아래 <code>mcp.json</code>을 붙여넣습니다.
        </li>
        <li>
          또는 로컬 stdio: 저장소의 <code>mcp/run.mjs</code> 경로를 사용합니다.
        </li>
        <li>
          채팅에서 「프로필생성도우미 시작해줘」라고 하면{" "}
          <code>start_profile_wizard</code>가 동작합니다.
        </li>
      </ol>
      <CopyField label="Cursor mcp.json (원격 URL)" value={cursorRemoteJson} multiline />
      <CopyField label="Cursor mcp.json (stdio)" value={cursorStdioJson} multiline />

      <h3 className="mcp-guide-title">Claude (Desktop / Claude Code)</h3>
      <ol className="mcp-steps">
        <li>
          Claude Desktop: 설정 → 개발자 →{" "}
          <code>claude_desktop_config.json</code>에 HTTP MCP를 추가합니다.
        </li>
        <li>
          Claude.ai Custom Connector: MCP URL에{" "}
          <code>{mcpUrl}</code> (또는 토큰 포함 URL)을 등록합니다.
        </li>
        <li>
          Claude Code: 아래 CLI를 실행한 뒤{" "}
          <code>/mcp</code>로 연결을 확인합니다.
        </li>
        <li>
          연결 후 「프로필생성도우미 작동시켜줘」→ 질의응답으로 프로필 완성.
        </li>
      </ol>
      <CopyField
        label="Claude Desktop / HTTP config"
        value={claudeDesktopJson}
        multiline
      />
      <CopyField label="Claude Code CLI" value={claudeCodeCli} multiline />

      <h3 className="mcp-guide-title">ChatGPT (Custom GPT / Connector)</h3>
      <ol className="mcp-steps">
        <li>
          GPT Actions 또는 MCP Connector에 MCP URL을 등록합니다:{" "}
          <code>{mcpUrl}</code>
        </li>
        <li>
          인증: Bearer 토큰(개인 MCP 토큰) 또는 URL{" "}
          <code>?token=</code> 쿼리. (일부 ChatGPT Connector는 OAuth만
          지원할 수 있습니다 — 그 경우 Claude/Cursor URL 방식을 권장합니다.)
        </li>
        <li>
          Instructions에 「연결 후 start_profile_wizard로 프로필을 완성한다」를
          넣습니다.
        </li>
        <li>
          디자인 변경:{" "}
          <code>list_design_capabilities</code> →{" "}
          <code>update_design</code> / <code>upsert_section</code> /{" "}
          <code>upsert_link</code> (부분 수정) /{" "}
          <code>get_preview_url</code>
        </li>
      </ol>

      <h3 className="mcp-guide-title">주요 도구</h3>
      <ul className="mcp-tool-list">
        <li>
          <code>list_design_capabilities</code> — 편집 가능 필드·아이콘·레시피
        </li>
        <li>
          <code>update_design</code> / <code>upsert_section</code> — 색·헤드라인·통계바·섹션
        </li>
        <li>
          <code>upsert_link</code> — 링크 생성/부분 수정 (iconKey·badge·span·featured)
        </li>
        <li>
          <code>get_preview_url</code> — 공개 URL 확인
        </li>
        <li>
          <code>list_design_templates</code> /{" "}
          <code>apply_design_template</code> — 템플릿
        </li>
        <li>
          <code>start_profile_wizard</code> /{" "}
          <code>answer_profile_wizard</code> — 질의응답 프로필 완성
        </li>
        <li>
          <code>set_avatar_image</code> /{" "}
          <code>set_background_image</code> / <code>set_custom_css</code>
        </li>
        <li>
          <code>get_page</code> / <code>update_profile</code> — 조회·프로필
        </li>
      </ul>

      <CopyField label="REST curl 예시" value={curlExample} multiline />

      <p className="hint" style={{ marginTop: 8 }}>
        개인 토큰은 내 페이지만 접근할 수 있으며, 다른 handle는 403입니다. MCP
        URL은 Streamable HTTP(<code>/api/mcp</code>)입니다.
      </p>
    </section>
  );
}
