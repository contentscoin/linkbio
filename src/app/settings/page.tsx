import Link from "next/link";
import { cookies } from "next/headers";
import { logoutAction } from "@/app/login/actions";
import { McpConnectPanel } from "@/components/mcp-connect-panel";
import { requireUserPage } from "@/lib/current";
import { getPageMcpTokenStatus, MCP_REVEAL_COOKIE } from "@/lib/mcp-token";
import { siteOrigin } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { user, page } = await requireUserPage();
  const params = await searchParams;
  const mcpStatus = getPageMcpTokenStatus(page);
  const origin = siteOrigin();
  const agentUrl = `${origin}/api/v1/agent`;
  const publicPageUrl = `${origin}/${page.handle}`;

  const store = await cookies();
  const revealedToken =
    params.saved === "mcp-token"
      ? (store.get(MCP_REVEAL_COOKIE)?.value ?? null)
      : null;

  return (
    <main className="shell shell--wide">
      <div className="topbar">
        <span className="brand">
          <span className="brand-dot" aria-hidden="true" />
          내 설정
        </span>
        <div className="row" style={{ margin: 0 }}>
          <Link className="btn" href="/admin">
            페이지 편집
          </Link>
          <Link className="btn" href={`/${page.handle}`} target="_blank">
            공개 페이지
          </Link>
          <form action={logoutAction}>
            <button className="btn" type="submit">
              로그아웃
            </button>
          </form>
        </div>
      </div>

      {params.saved === "mcp-token" ? (
        <div className="notice notice--ok">토큰이 발급되었습니다. 아래에 전체 값이 표시됩니다.</div>
      ) : null}
      {params.saved === "mcp-revoked" ? (
        <div className="notice notice--ok">토큰이 폐기되었습니다.</div>
      ) : null}
      {params.error ? <div className="auth-notice">{params.error}</div> : null}

      <section className="panel">
        <h2>계정</h2>
        <p className="lede" style={{ marginBottom: 16 }}>
          공개 프로필은 <strong>/{page.handle}</strong> · {user.email}
        </p>
        <div className="row">
          <Link className="btn btn--primary" href="/admin">
            링크 · 프로필 편집
          </Link>
          <Link className="btn" href={publicPageUrl} target="_blank">
            내 페이지 열기
          </Link>
        </div>
      </section>

      <McpConnectPanel
        agentUrl={agentUrl}
        handle={page.handle}
        hasToken={mcpStatus.hasToken}
        issuedToken={revealedToken}
        publicPageUrl={publicPageUrl}
        tokenCreatedAt={mcpStatus.createdAt}
        tokenPrefix={mcpStatus.prefix}
      />
    </main>
  );
}
