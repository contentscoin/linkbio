import Link from "next/link";
import {
  ExternalLink,
  Link2,
  LogOut,
  Palette,
  Settings,
} from "lucide-react";
import { cookies } from "next/headers";
import { Message } from "@/components/message";
import { McpConnectPanel } from "@/components/mcp-connect-panel";
import { logoutAction } from "@/app/login/actions";
import { requireCurrentUserPage } from "@/lib/current";
import { getPageMcpTokenStatus, MCP_REVEAL_COOKIE } from "@/lib/mcp-token";
import { messageFromSearchParams } from "@/lib/messages";

export const dynamic = "force-dynamic";

function siteOrigin() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.LINKBIO_PUBLIC_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const current = await requireCurrentUserPage();
  const params = await searchParams;
  const message = messageFromSearchParams(params);
  const mcpStatus = getPageMcpTokenStatus(current.page);
  const origin = siteOrigin();
  const agentUrl = `${origin}/api/v1/agent`;
  const publicPageUrl = `${origin}/${current.page.handle}`;

  const store = await cookies();
  const revealedToken =
    params.saved === "mcp-token"
      ? (store.get(MCP_REVEAL_COOKIE)?.value ?? null)
      : null;

  return (
    <main>
      <header className="shell toolbar">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            <Link2 size={18} />
          </span>
          <span>내 설정</span>
        </Link>
        <div className="nav-actions">
          <Link className="button secondary" href="/admin">
            <Palette size={17} />
            페이지 편집
          </Link>
          <Link
            className="button secondary"
            href={`/${current.page.handle}`}
            target="_blank"
          >
            <ExternalLink size={17} />
            공개 페이지
          </Link>
          <form action={logoutAction}>
            <button className="button secondary" type="submit">
              <LogOut size={17} />
              로그아웃
            </button>
          </form>
        </div>
      </header>

      <section className="shell stack settings-layout">
        <Message message={message} />

        <section className="form-card">
          <div>
            <p className="eyebrow">
              <Settings size={14} /> 마이페이지
            </p>
            <h1 className="compact-title">계정 · MCP 연결</h1>
            <p className="small muted">
              공개 프로필은 <strong>@{current.page.handle}</strong> ·{" "}
              {current.user.email}
            </p>
          </div>
          <div className="button-row">
            <Link className="button primary" href="/admin">
              <Palette size={17} />
              링크 · 디자인 편집
            </Link>
            <Link className="button secondary" href={publicPageUrl} target="_blank">
              <ExternalLink size={17} />
              내 페이지 열기
            </Link>
          </div>
        </section>

        <McpConnectPanel
          agentUrl={agentUrl}
          handle={current.page.handle}
          hasToken={mcpStatus.hasToken}
          issuedToken={revealedToken}
          publicPageUrl={publicPageUrl}
          tokenCreatedAt={mcpStatus.createdAt}
          tokenPrefix={mcpStatus.prefix}
        />
      </section>
    </main>
  );
}
