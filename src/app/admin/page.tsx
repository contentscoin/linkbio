import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { links } from "@/db/schema";
import { requireUserPage } from "@/lib/current";
import {
  DESIGN_TEMPLATES,
  THEME_OPTIONS,
} from "@/lib/design-templates";
import { parsePageDesign } from "@/lib/page-design";
import {
  applyDesignTemplateAction,
  createLinkAction,
  deleteLinkAction,
  logoutAction,
  updateDesignAction,
  updateProfileAction,
} from "./actions";
import { AccentField } from "@/components/accent-field";

export const dynamic = "force-dynamic";

const LAYOUT_OPTIONS = [
  { id: "stack", label: "스택" },
  { id: "bento", label: "벤토" },
  { id: "list", label: "리스트" },
] as const;

const CARD_OPTIONS = [
  { id: "elevated", label: "입체" },
  { id: "solid", label: "솔리드" },
  { id: "outline", label: "아웃라인" },
  { id: "glass", label: "글래스" },
  { id: "flat", label: "플랫" },
  { id: "sticker", label: "스티커" },
] as const;

const FONT_OPTIONS = [
  { id: "sans", label: "고딕" },
  { id: "serif", label: "명조" },
  { id: "mono", label: "모노" },
] as const;

const PATTERN_OPTIONS = [
  { id: "none", label: "없음" },
  { id: "dots", label: "도트" },
  { id: "grid", label: "그리드" },
  { id: "stripes", label: "스트라이프" },
  { id: "grain", label: "그레인" },
  { id: "waves", label: "웨이브" },
] as const;

const SIZE_OPTIONS = [
  { id: "compact", label: "컴팩트" },
  { id: "normal", label: "보통" },
  { id: "roomy", label: "여유" },
] as const;

const RADIUS_OPTIONS = [
  { id: "sharp", label: "각짐" },
  { id: "soft", label: "부드러움" },
  { id: "round", label: "둥글게" },
  { id: "pill", label: "필" },
] as const;

const MOTION_OPTIONS = [
  { id: "none", label: "없음" },
  { id: "float", label: "플로트" },
  { id: "drift", label: "드리프트" },
  { id: "pulse", label: "펄스" },
  { id: "scan", label: "스캔" },
] as const;

const EFFECT_OPTIONS = [
  { id: "none", label: "없음" },
  { id: "vignette", label: "비네트" },
  { id: "glow", label: "글로우" },
  { id: "spotlight", label: "스포트라이트" },
  { id: "scanlines", label: "스캔라인" },
] as const;

const EFFECT_CARD_OPTIONS = [
  { id: "none", label: "없음" },
  { id: "lift", label: "리프트" },
  { id: "glow", label: "글로우" },
  { id: "tilt", label: "틸트" },
  { id: "shine", label: "샤인" },
  { id: "press", label: "프레스" },
] as const;

function savedLabel(saved?: string) {
  if (saved === "design") return "디자인이 저장되었습니다.";
  if (saved === "profile") return "프로필이 저장되었습니다.";
  if (saved) return "저장되었습니다.";
  return null;
}

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

  const design = parsePageDesign(page.design);
  const currentTemplateId =
    design.templateId ||
    DESIGN_TEMPLATES.find((t) => t.theme === (page.theme || "fairway"))?.id ||
    "fairway";
  const currentTheme = page.theme || "fairway";
  const currentAccent = page.accent || "#2d6a4f";
  const notice = savedLabel(params.saved);

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
      {notice ? <div className="notice notice--ok">{notice}</div> : null}

      <section className="panel">
        <h2>미리보기</h2>
        <p className="lede" style={{ marginBottom: 12 }}>
          저장 후 아래 미리보기와 공개 페이지에 바로 반영됩니다.
        </p>
        <div className="livebox">
          <iframe
            title={`${page.displayName} 미리보기`}
            src={`/${page.handle}`}
          />
        </div>
      </section>

      <section className="panel">
        <h2>디자인 템플릿</h2>
        <p className="lede" style={{ marginBottom: 16 }}>
          테마·레이아웃·카드 스타일을 한 번에 적용합니다.
        </p>
        <form action={applyDesignTemplateAction}>
          <div className="pick">
            {DESIGN_TEMPLATES.map((template) => (
              <label key={template.id}>
                <input
                  className="pick-input"
                  type="radio"
                  name="templateId"
                  value={template.id}
                  defaultChecked={template.id === currentTemplateId}
                />
                <span className="pick-tile">
                  <span className="pick-bars" aria-hidden="true">
                    <span
                      className="pick-bar"
                      style={{ background: template.accent }}
                    />
                    <span
                      className="pick-bar"
                      style={{
                        background:
                          THEME_OPTIONS.find((t) => t.id === template.theme)
                            ?.colors[0] ?? "#eee",
                      }}
                    />
                    <span
                      className="pick-bar"
                      style={{
                        background:
                          THEME_OPTIONS.find((t) => t.id === template.theme)
                            ?.colors[2] ?? "#fff",
                      }}
                    />
                  </span>
                  <span className="pick-name">{template.name}</span>
                  <span className="pick-layout">{template.description}</span>
                </span>
              </label>
            ))}
          </div>
          <button className="btn btn--primary" type="submit">
            템플릿 적용
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>테마 · 꾸미기</h2>
        <p className="lede" style={{ marginBottom: 16 }}>
          테마, 포인트 컬러, 레이아웃, 이미지, CSS를 직접 조정합니다.
        </p>
        <form action={updateDesignAction}>
          <div className="field">
            <label>테마</label>
            <div className="pick">
              {THEME_OPTIONS.map((theme) => (
                <label key={theme.id}>
                  <input
                    className="pick-input"
                    type="radio"
                    name="theme"
                    value={theme.id}
                    defaultChecked={theme.id === currentTheme}
                  />
                  <span className="pick-tile">
                    <span className="pick-bars" aria-hidden="true">
                      {theme.colors.map((color) => (
                        <span
                          key={color}
                          className="pick-bar"
                          style={{ background: color }}
                        />
                      ))}
                    </span>
                    <span className="pick-name">{theme.name}</span>
                    <span className="pick-layout">{theme.id}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <AccentField defaultValue={currentAccent} />

          <div className="field">
            <label htmlFor="layout">레이아웃</label>
            <select
              id="layout"
              name="layout"
              defaultValue={design.layout || "stack"}
            >
              {LAYOUT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="row">
            <div className="field">
              <label htmlFor="card">카드 스타일</label>
              <select id="card" name="card" defaultValue={design.card || "elevated"}>
                {CARD_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="font">폰트</label>
              <select id="font" name="font" defaultValue={design.font || "sans"}>
                {FONT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label htmlFor="pattern">패턴</label>
              <select
                id="pattern"
                name="pattern"
                defaultValue={design.pattern || "none"}
              >
                {PATTERN_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="size">간격</label>
              <select id="size" name="size" defaultValue={design.size || "normal"}>
                {SIZE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label htmlFor="radius">모서리</label>
              <select
                id="radius"
                name="radius"
                defaultValue={design.radius || "round"}
              >
                {RADIUS_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="effectCard">호버 효과</label>
              <select
                id="effectCard"
                name="effectCard"
                defaultValue={design.effectCard || "lift"}
              >
                {EFFECT_CARD_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label htmlFor="motion">배경 모션</label>
              <select
                id="motion"
                name="motion"
                defaultValue={design.motion || "none"}
              >
                {MOTION_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="effect">화면 효과</label>
              <select
                id="effect"
                name="effect"
                defaultValue={design.effect || "none"}
              >
                {EFFECT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="avatarImageUrl">프로필 이미지 URL (https)</label>
            <input
              id="avatarImageUrl"
              name="avatarImageUrl"
              type="url"
              placeholder="https://"
              defaultValue={design.avatarImageUrl || ""}
            />
            <label className="check" style={{ marginTop: 8 }}>
              <input type="checkbox" name="clearAvatar" /> 이미지 제거(이니셜
              사용)
            </label>
          </div>

          <div className="field">
            <label htmlFor="backgroundImageUrl">배경 이미지 URL (https)</label>
            <input
              id="backgroundImageUrl"
              name="backgroundImageUrl"
              type="url"
              placeholder="https://"
              defaultValue={design.backgroundImageUrl || ""}
            />
            <label className="check" style={{ marginTop: 8 }}>
              <input type="checkbox" name="clearBackground" /> 배경 이미지 제거
            </label>
          </div>

          <div className="field">
            <label htmlFor="scrim">배경 스크림 (0~0.85)</label>
            <input
              id="scrim"
              name="scrim"
              type="number"
              min={0}
              max={0.85}
              step={0.05}
              defaultValue={
                typeof design.scrim === "number" ? design.scrim : ""
              }
              placeholder="0.35"
            />
          </div>

          <div className="field">
            <label htmlFor="customCss">커스텀 CSS</label>
            <textarea
              id="customCss"
              name="customCss"
              rows={5}
              defaultValue={design.customCss || ""}
              placeholder={".bio-name{letter-spacing:-.04em}"}
            />
            <label className="check" style={{ marginTop: 8 }}>
              <input type="checkbox" name="clearCss" /> CSS 제거
            </label>
          </div>

          <button className="btn btn--primary" type="submit">
            디자인 저장
          </button>
        </form>
      </section>

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
            <input
              id="url"
              name="url"
              type="url"
              placeholder="https://"
              required
            />
          </div>
          <button className="btn btn--primary" type="submit">
            링크 추가
          </button>
        </form>
      </section>
    </main>
  );
}
