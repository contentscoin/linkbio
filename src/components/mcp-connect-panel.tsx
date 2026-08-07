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
  const looksLikeVercel = /vercel\.app/i.test(mcpUrl) || /vercel\.app/i.test(baseUrl);

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
    `# 또는 URL에 토큰 포함 (ChatGPT/일부 클라이언트 권장)`,
    `claude mcp add --transport http omo-bio-${handle} \\`,
    `  "${mcpUrlWithToken}"`,
  ].join("\n");

  const curlExample = [
    `# 페이지 스키마 조회`,
    `curl -X POST -H "Authorization: Bearer ${tokenForSnippets}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"action":"get_page_schema","handle":"${handle}"}' \\`,
    `  "${agentUrl}"`,
    ``,
    `# 템플릿으로 초안 생성`,
    `curl -X POST -H "Authorization: Bearer ${tokenForSnippets}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"action":"create_page_from_template","handle":"${handle}","templateId":"fmgs-premium"}' \\`,
    `  "${agentUrl}"`,
    ``,
    `# 검증 후 게시`,
    `curl -X POST -H "Authorization: Bearer ${tokenForSnippets}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"action":"publish_page","handle":"${handle}"}' \\`,
    `  "${agentUrl}"`,
  ].join("\n");

  return (
    <section className="panel mcp-connect">
      <h2>MCP · API 연결</h2>
      <p className="lede" style={{ marginBottom: 16 }}>
        Cursor · Claude · ChatGPT에서 <strong>/{handle}</strong> 페이지만
        조회·수정할 수 있는 개인 MCP URL과 토큰입니다.
      </p>

      <div className="notice notice--ok" style={{ marginBottom: 16 }}>
        MCP URL은 반드시 <strong>https://bio.omo.co.kr/api/mcp</strong> 를
        사용하세요. <code>*.vercel.app</code> 주소는 브라우저/보안 필터에
        차단될 수 있습니다 (ERR_BLOCKED_BY_CS).
      </div>

      {looksLikeVercel ? (
        <div className="auth-notice" style={{ marginBottom: 16 }}>
          현재 표시된 URL에 vercel.app이 포함되어 있습니다. 배포 환경 변수{" "}
          <code>NEXT_PUBLIC_SITE_URL=https://bio.omo.co.kr</code> 를 확인하세요.
        </div>
      ) : null}

      <ol className="mcp-steps">
        <li>
          아래에서 <strong>개인 토큰</strong>을 발급·복사합니다.
        </li>
        <li>
          클라이언트에 MCP URL을 등록합니다. ChatGPT는{" "}
          <code>?token=</code> 포함 URL을 권장합니다.
        </li>
        <li>
          연결 후 <code>open_profile_designer</code> 또는{" "}
          <code>list_templates</code> → <code>create_page_from_template</code>{" "}
          으로 시작합니다. CSS 직접 입력은 사용하지 마세요.
        </li>
      </ol>

      <CopyField label="MCP URL (원격 · Claude/GPT/Cursor)" value={mcpUrl} />
      <CopyField
        label="MCP URL + 토큰 (ChatGPT · 헤더 미지원 클라이언트 권장)"
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
          <code>LINKBIO_BASE_URL</code>은 <code>https://bio.omo.co.kr</code>{" "}
          로 두세요.
        </li>
        <li>
          채팅에서 「프로필 디자이너 열어줘」→{" "}
          <code>open_profile_designer</code>
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
          Claude Code: 아래 CLI를 실행한 뒤 <code>/mcp</code>로 확인합니다.
        </li>
        <li>
          연결 후 <code>open_profile_designer</code> 또는{" "}
          <code>list_templates</code>로 시작합니다.
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
          MCP Connector에 <strong>토큰 포함 URL</strong>을 등록합니다:{" "}
          <code>{mcpUrlWithToken}</code>
        </li>
        <li>
          도메인은 <code>bio.omo.co.kr</code>만 사용.{" "}
          <code>*.vercel.app</code> 은 차단될 수 있습니다.
        </li>
        <li>
          Instructions: 「연결 후 open_profile_designer를 호출하고, CSS 대신
          Page Schema(list_templates → create_page_from_template →
          update_page_content → validate_page → publish_page)로 편집한다」
        </li>
        <li>
          위젯이 지원되면 <code>open_profile_designer</code>가 ChatGPT 안에
          템플릿/콘텐츠/미리보기 UI를 엽니다.
        </li>
      </ol>

      <h3 className="mcp-guide-title">주요 도구 (Page Schema · 권장)</h3>
      <ul className="mcp-tool-list">
        <li>
          <code>open_profile_designer</code> — ChatGPT/MCP Apps 제작 위젯
        </li>
        <li>
          <code>list_templates</code> / <code>get_template</code> — FMGS Premium
          등 버전 템플릿
        </li>
        <li>
          <code>create_page_from_template</code> — 템플릿으로 스키마 적용
        </li>
        <li>
          <code>get_page_schema</code> / <code>update_page_content</code> /
          <code>update_section</code> / <code>upsert_component</code>
        </li>
        <li>
          <code>upload_asset</code> — dataUri → url·width·height (로고/아이콘)
        </li>
        <li>
          <code>render_preview</code> / <code>validate_page</code>
        </li>
        <li>
          <code>save_draft</code> / <code>publish_page</code> /{" "}
          <code>restore_version</code>
        </li>
      </ul>

      <h3 className="mcp-guide-title">레거시 도구 (스키마 없을 때만)</h3>
      <ul className="mcp-tool-list">
        <li>
          <code>update_design</code> / <code>upsert_section</code> /{" "}
          <code>upsert_link</code>
        </li>
        <li>
          <code>list_design_templates</code> /{" "}
          <code>apply_design_template</code>
        </li>
        <li>
          <code>set_custom_css</code> — 비권장. Page Schema 페이지에서는 쓰지
          마세요.
        </li>
      </ul>

      <CopyField label="REST curl 예시" value={curlExample} multiline />

      <p className="hint" style={{ marginTop: 8 }}>
        개인 토큰은 내 페이지만 접근할 수 있으며, 다른 handle는 403입니다. MCP
        URL은 Streamable HTTP(<code>/api/mcp</code>)입니다. 도구 목록이 안
        보이면 MCP를 재연결하세요.
      </p>
    </section>
  );
}
