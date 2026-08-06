import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { links } from "@/db/schema";
import { AccentField } from "@/components/accent-field";
import { ButtonDesignPanel } from "@/components/button-design-panel";
import { SafeActionForm } from "@/components/safe-action-form";
import { TemplateApplyForm } from "@/components/template-apply-form";
import { requireUserPage } from "@/lib/current";
import { DESIGN_TEMPLATES, THEME_OPTIONS } from "@/lib/design-templates";
import { parsePageDesign } from "@/lib/page-design";
import {
  createLinkAction,
  deleteLinkAction,
  logoutAction,
  updateDesignAction,
  updateProfileAction,
} from "./actions";

export const dynamic = "force-dynamic";

const LAYOUT_OPTIONS = [
  { id: "stack", label: "스택" },
  { id: "bento", label: "벤토" },
  { id: "list", label: "리스트" },
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
          링크스토리처럼 업종별 템플릿으로 테마·버튼·레이아웃을 한 번에
          적용합니다.
        </p>
        <TemplateApplyForm currentTemplateId={currentTemplateId} />
      </section>

      <section className="panel">
        <h2>버튼 디자인</h2>
        <p className="lede" style={{ marginBottom: 16 }}>
          스타일·모양·그림자·호버·색상을 링크스토리식 꾸미기로 조정합니다.
        </p>
        <SafeActionForm action={updateDesignAction}>
          <input type="hidden" name="theme" value={currentTheme} />
          <input type="hidden" name="accent" value={currentAccent} />
          <input type="hidden" name="layout" value={design.layout || "stack"} />
          <input type="hidden" name="font" value={design.font || "sans"} />
          <input
            type="hidden"
            name="pattern"
            value={design.pattern || "none"}
          />
          <input type="hidden" name="motion" value={design.motion || "none"} />
          <input type="hidden" name="effect" value={design.effect || "none"} />
          {design.avatarImageUrl ? (
            <input
              type="hidden"
              name="avatarImageUrl"
              value={design.avatarImageUrl}
            />
          ) : null}
          {design.backgroundImageUrl ? (
            <input
              type="hidden"
              name="backgroundImageUrl"
              value={design.backgroundImageUrl}
            />
          ) : null}
          {typeof design.scrim === "number" ? (
            <input type="hidden" name="scrim" value={String(design.scrim)} />
          ) : null}
          {design.customCss ? (
            <input type="hidden" name="customCss" value={design.customCss} />
          ) : null}

          <ButtonDesignPanel
            accent={currentAccent}
            buttonStyle={design.buttonStyle || "elevated"}
            buttonShadow={design.buttonShadow || "none"}
            radius={design.radius || "round"}
            size={design.size || "normal"}
            effectCard={design.effectCard || "lift"}
            buttonFill={design.buttonFill || ""}
            buttonText={design.buttonText || ""}
          />

          <button className="btn btn--primary" type="submit">
            버튼 디자인 저장
          </button>
        </SafeActionForm>
      </section>

      <section className="panel">
        <h2>테마 · 배경 · 꾸미기</h2>
        <p className="lede" style={{ marginBottom: 16 }}>
          페이지 테마, 포인트 컬러, 레이아웃, 배경 이미지, CSS를 조정합니다.
        </p>
        <SafeActionForm action={updateDesignAction}>
          <input
            type="hidden"
            name="buttonStyle"
            value={design.buttonStyle || "elevated"}
          />
          <input
            type="hidden"
            name="buttonShadow"
            value={design.buttonShadow || "none"}
          />
          <input type="hidden" name="radius" value={design.radius || "round"} />
          <input type="hidden" name="size" value={design.size || "normal"} />
          <input
            type="hidden"
            name="effectCard"
            value={design.effectCard || "lift"}
          />
          {design.buttonFill ? (
            <input type="hidden" name="buttonFill" value={design.buttonFill} />
          ) : null}
          {design.buttonText ? (
            <input type="hidden" name="buttonText" value={design.buttonText} />
          ) : null}

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
              <label htmlFor="font">폰트</label>
              <select
                id="font"
                name="font"
                defaultValue={design.font || "sans"}
              >
                {FONT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
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
            테마 · 꾸미기 저장
          </button>
        </SafeActionForm>
      </section>

      <section className="panel">
        <h2>프로필</h2>
        <p className="lede" style={{ marginBottom: 16 }}>
          로그인: {user.email} · 주소: /{page.handle}
        </p>
        <SafeActionForm action={updateProfileAction}>
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
        </SafeActionForm>
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
              <SafeActionForm action={deleteLinkAction}>
                <input type="hidden" name="linkId" value={link.id} />
                <button className="btn" type="submit">
                  삭제
                </button>
              </SafeActionForm>
            </li>
          ))}
        </ul>

        <SafeActionForm action={createLinkAction}>
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
        </SafeActionForm>
      </section>
    </main>
  );
}
