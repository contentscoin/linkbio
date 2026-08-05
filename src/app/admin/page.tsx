import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { links } from "@/db/schema";
import { requireUserPage } from "@/lib/current";
import {
  createLinkAction,
  deleteLinkAction,
  logoutAction,
  updateProfileAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { user, page } = await requireUserPage();
  const params = await searchParams;
  const db = getDb();
  const pageLinks = await db
    .select()
    .from(links)
    .where(eq(links.pageId, page.id))
    .orderBy(asc(links.sortOrder), asc(links.createdAt));

  return (
    <main className="shell shell--wide">
      <div className="topbar">
        <span className="brand">
          <span className="brand-dot" aria-hidden="true" />
          OMO Bio 편집
        </span>
        <div className="row" style={{ margin: 0 }}>
          <Link className="btn" href="/settings">
            MCP · 설정
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

      {params.error ? (
        <div className="auth-notice">{params.error}</div>
      ) : null}
      {params.saved ? (
        <div
          className="panel"
          style={{ borderColor: "var(--green)", color: "var(--green)" }}
        >
          저장되었습니다.
        </div>
      ) : null}

      <section className="panel">
        <h2>프로필</h2>
        <p className="lede" style={{ marginBottom: 16 }}>
          로그인: {user.email} · 주소: /{page.handle}
        </p>
        <form action={updateProfileAction}>
          <div className="field">
            <label htmlFor="displayName">표시 이름</label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              defaultValue={page.displayName}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="bio">소개</label>
            <textarea id="bio" name="bio" defaultValue={page.bio} rows={3} />
          </div>
          <div className="field">
            <label>
              <input
                type="checkbox"
                name="published"
                defaultChecked={page.published || page.isPublished}
              />{" "}
              공개하기
            </label>
          </div>
          <button className="btn btn--primary" type="submit">
            프로필 저장
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>링크 버튼</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 18px" }}>
          {pageLinks.map((link) => (
            <li
              key={link.id}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <strong style={{ display: "block" }}>{link.label}</strong>
                <span
                  style={{
                    color: "var(--ink-soft)",
                    fontSize: 12.5,
                    wordBreak: "break-all",
                  }}
                >
                  {link.url}
                </span>
              </div>
              <form action={deleteLinkAction}>
                <input type="hidden" name="linkId" value={link.id} />
                <button className="btn" type="submit">
                  삭제
                </button>
              </form>
            </li>
          ))}
        </ul>

        <form action={createLinkAction}>
          <div className="field">
            <label htmlFor="label">버튼 제목</label>
            <input id="label" name="label" type="text" required />
          </div>
          <div className="field">
            <label htmlFor="url">URL</label>
            <input id="url" name="url" type="url" placeholder="https://" required />
          </div>
          <button className="btn btn--primary" type="submit">
            링크 추가
          </button>
        </form>
      </section>
    </main>
  );
}
