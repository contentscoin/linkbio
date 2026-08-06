"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { listSchemaTemplates, getSchemaTemplate } from "@/lib/schema-templates";
import type { PageSchema, SchemaSection } from "@/lib/page-schema";
import { validatePageSchema } from "@/lib/page-schema";
import styles from "./designer.module.css";

type StepId = "guide" | "template" | "content" | "design" | "preview";

const STEPS: { id: StepId; label: string }[] = [
  { id: "guide", label: "가이드" },
  { id: "template", label: "템플릿" },
  { id: "content", label: "콘텐츠" },
  { id: "design", label: "디자인" },
  { id: "preview", label: "미리보기" },
];

const INDUSTRIES = ["골프·스포츠", "에이전시", "개인 브랜딩", "제품/SaaS", "포트폴리오", "기타"];
const PURPOSES = ["상담 유도", "링크 모음", "채용/협업", "제품 출시", "포트폴리오"];
const CTAS = ["무료 상담", "문의하기", "예약", "구매", "팔로우"];

const THEMES = [
  { id: "navy-lime", label: "Navy Lime" },
  { id: "fairway", label: "Fairway" },
  { id: "noir", label: "Noir" },
  { id: "corporate", label: "Corporate" },
];

function postToHost(type: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.parent?.postMessage({ source: "bioomo-designer", type, payload }, "*");
}

async function callAgent(
  action: string,
  body: Record<string, unknown>,
  token?: string,
) {
  if (token) {
    const res = await fetch("/api/v1/agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, ...body }),
    });
    return res.json();
  }
  const id = `req_${Date.now()}`;
  return new Promise((resolve) => {
    const onMessage = (event: MessageEvent) => {
      if (!event.data || event.data.source !== "bioomo-host") return;
      if (event.data.type !== "toolResult" || event.data.id !== id) return;
      window.removeEventListener("message", onMessage);
      resolve(
        event.data.error
          ? { ok: false, error: event.data.error }
          : event.data.result,
      );
    };
    window.addEventListener("message", onMessage);
    postToHost("callTool", { id, name: action, args: body });
    setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve({
        ok: false,
        error:
          "Host tool bridge timeout — token으로 API 호출하거나 MCP Apps에서 여세요.",
      });
    }, 8000);
  });
}

function heroOf(schema: PageSchema) {
  const section = schema.sections.find((s) => s.type === "hero");
  return section && section.type === "hero" ? section : null;
}

function ctaOf(schema: PageSchema) {
  const section = schema.sections.find((s) => s.type === "cta");
  return section && section.type === "cta" ? section : null;
}

function thumbClass(theme: string) {
  if (theme === "fairway") return `${styles.thumb} ${styles.thumbFairway}`;
  if (theme === "noir") return `${styles.thumb} ${styles.thumbNoir}`;
  if (theme === "corporate") return `${styles.thumb} ${styles.thumbCorporate}`;
  return styles.thumb;
}

export function ProfileDesigner({
  handle: initialHandle,
  embed,
  initialStep,
  token,
}: {
  handle: string;
  embed?: boolean;
  initialStep?: string;
  token?: string;
}) {
  const templates = useMemo(() => listSchemaTemplates(), []);
  const [step, setStep] = useState<StepId>(
    (STEPS.find((s) => s.id === initialStep)?.id as StepId) || "guide",
  );
  const [handle, setHandle] = useState(initialHandle);
  const [industry, setIndustry] = useState(INDUSTRIES[0]!);
  const [purpose, setPurpose] = useState(PURPOSES[0]!);
  const [ctaChoice, setCtaChoice] = useState(CTAS[0]!);
  const [templateId, setTemplateId] = useState("fmgs-premium");
  const [schema, setSchema] = useState<PageSchema | null>(() => {
    const t = getSchemaTemplate("fmgs-premium");
    return t ? structuredClone(t.schema) : null;
  });
  const [viewport, setViewport] = useState<"mobile" | "tablet" | "desktop">(
    "mobile",
  );
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const validation = schema ? validatePageSchema(schema) : [];

  useEffect(() => {
    if (!handle || !token) return;
    startTransition(async () => {
      const res = (await callAgent("get_page_schema", { handle }, token)) as {
        ok?: boolean;
        draft?: PageSchema;
      };
      if (res?.ok && res.draft) setSchema(res.draft);
    });
  }, [handle, token]);

  function updateHero(
    patch: Partial<Extract<SchemaSection, { type: "hero" }>>,
  ) {
    if (!schema) return;
    setSchema({
      ...schema,
      sections: schema.sections.map((s) =>
        s.type === "hero" ? { ...s, ...patch } : s,
      ),
    });
  }

  function applyTemplate(id: string) {
    const t = getSchemaTemplate(id);
    if (!t) return;
    setTemplateId(id);
    setSchema(structuredClone(t.schema));
    setStep("content");
  }

  function save(kind: "draft" | "publish") {
    if (!schema || !handle) {
      setMessage("handle과 스키마가 필요합니다.");
      return;
    }
    startTransition(async () => {
      const action = kind === "publish" ? "publish_page" : "save_draft";
      const res = (await callAgent(action, { handle, schema }, token)) as {
        ok?: boolean;
        error?: string;
        previewUrl?: string;
      };
      if (res?.ok) {
        setMessage(
          kind === "publish"
            ? `게시됨 · ${res.previewUrl || ""}`
            : `초안 저장됨 · ${res.previewUrl || ""}`,
        );
      } else {
        setMessage(res?.error || "저장 실패 — MCP 토큰 또는 Apps bridge 필요");
      }
    });
  }

  const previewWidth =
    viewport === "mobile" ? 390 : viewport === "tablet" ? 768 : 960;
  const hero = schema ? heroOf(schema) : null;
  const cta = schema ? ctaOf(schema) : null;

  return (
    <div className={`${styles.pd} ${embed ? styles.embed : ""}`}>
      <header className={styles.top}>
        <div>
          <p className={styles.brand}>Bioomo</p>
          <h1>프로필 디자이너</h1>
          <p className={styles.sub}>구조화된 Page Schema · CSS 직접 입력 없음</p>
        </div>
        <label className={styles.handle}>
          handle
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value.trim().toLowerCase())}
            placeholder="fmg"
          />
        </label>
      </header>

      <nav className={styles.steps} aria-label="제작 단계">
        {STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={step === s.id ? "active" : ""}
            onClick={() => setStep(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <main className={styles.main}>
        {step === "guide" && (
          <section className={styles.panel}>
            <h2>기본 가이드</h2>
            <p>
              업종·목적·CTA를 고르면 템플릿 선택이 쉬워집니다. 권장 이미지: 로고
              512×512, 서비스 아이콘 128×128.
            </p>
            <div className={styles.fields}>
              <label>
                업종
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                >
                  {INDUSTRIES.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                페이지 목적
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                >
                  {PURPOSES.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                CTA
                <select
                  value={ctaChoice}
                  onChange={(e) => setCtaChoice(e.target.value)}
                >
                  {CTAS.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              className={styles.primary}
              onClick={() => setStep("template")}
            >
              템플릿 선택하기
            </button>
          </section>
        )}

        {step === "template" && (
          <section className={styles.panel}>
            <h2>템플릿 선택</h2>
            <div className={styles.templates}>
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`${styles.tpl} ${templateId === t.id ? styles.tplSelected : ""}`}
                  onClick={() => applyTemplate(t.id)}
                >
                  <div className={thumbClass(t.theme)} />
                  <strong>{t.name}</strong>
                  <span>{t.description}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === "content" && schema && (
          <section className={styles.panel}>
            <h2>콘텐츠 편집</h2>
            <div className={styles.fields}>
              <label>
                브랜드명
                <input
                  value={schema.brand?.displayName || ""}
                  onChange={(e) =>
                    setSchema({
                      ...schema,
                      brand: { ...schema.brand, displayName: e.target.value },
                    })
                  }
                />
              </label>
              <label>
                로고 URL
                <input
                  value={schema.brand?.logoUrl || ""}
                  onChange={(e) =>
                    setSchema({
                      ...schema,
                      brand: { ...schema.brand, logoUrl: e.target.value },
                    })
                  }
                  placeholder="https://..."
                />
              </label>
              <label>
                헤드라인
                <textarea
                  rows={3}
                  value={hero?.headline || ""}
                  onChange={(e) => updateHero({ headline: e.target.value })}
                />
              </label>
            </div>
            <p className={styles.note}>
              서비스/CTA/바로가기는 Page Schema 섹션으로 관리됩니다. MCP
              update_section / upsert_component로도 수정할 수 있습니다.
            </p>
            <button
              type="button"
              className={styles.primary}
              onClick={() => setStep("design")}
            >
              디자인 설정
            </button>
          </section>
        )}

        {step === "design" && schema && (
          <section className={styles.panel}>
            <h2>디자인 설정</h2>
            <p>허용된 토큰만 선택합니다. CSS 입력창은 없습니다.</p>
            <div className={styles.fields}>
              <label>
                컬러 팔레트
                <select
                  value={schema.theme}
                  onChange={(e) =>
                    setSchema({ ...schema, theme: e.target.value })
                  }
                >
                  {THEMES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                폰트
                <select
                  value={schema.designOptions?.font || "sans"}
                  onChange={(e) =>
                    setSchema({
                      ...schema,
                      designOptions: {
                        ...schema.designOptions,
                        font: e.target.value as "sans" | "serif" | "mono",
                      },
                    })
                  }
                >
                  <option value="sans">Sans</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Mono</option>
                </select>
              </label>
              <label>
                라운드
                <select
                  value={schema.designOptions?.radius || "round"}
                  onChange={(e) =>
                    setSchema({
                      ...schema,
                      designOptions: {
                        ...schema.designOptions,
                        radius: e.target.value as
                          | "sharp"
                          | "soft"
                          | "round"
                          | "pill",
                      },
                    })
                  }
                >
                  <option value="sharp">Sharp</option>
                  <option value="soft">Soft</option>
                  <option value="round">Round</option>
                  <option value="pill">Pill</option>
                </select>
              </label>
              <label>
                버튼 스타일
                <select
                  value={schema.designOptions?.buttonStyle || "elevated"}
                  onChange={(e) =>
                    setSchema({
                      ...schema,
                      designOptions: {
                        ...schema.designOptions,
                        buttonStyle: e.target.value,
                      },
                    })
                  }
                >
                  <option value="elevated">Elevated</option>
                  <option value="soft">Soft</option>
                  <option value="outline">Outline</option>
                  <option value="ghost">Ghost</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              className={styles.primary}
              onClick={() => setStep("preview")}
            >
              미리보기
            </button>
          </section>
        )}

        {step === "preview" && schema && (
          <section className={styles.panel}>
            <h2>미리보기 · 게시</h2>
            <div className={styles.viewportTabs}>
              {(["mobile", "tablet", "desktop"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={viewport === v ? "active" : ""}
                  onClick={() => setViewport(v)}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className={styles.previewFrame} style={{ width: previewWidth }}>
              <div className={styles.previewInner}>
                <p className={styles.previewBrand}>
                  {schema.brand?.displayName || "Brand"}
                </p>
                <h3>{hero?.headline || "헤드라인"}</h3>
                <div className={styles.previewGrid}>
                  {schema.sections
                    .filter((s) => s.type === "serviceGrid")
                    .flatMap((s) => (s.type === "serviceGrid" ? s.items : []))
                    .slice(0, 4)
                    .map((item) => (
                      <div key={item.id} className={styles.card}>
                        <strong>{item.label}</strong>
                        <span>{item.sublabel}</span>
                      </div>
                    ))}
                </div>
                <div className={styles.previewCta}>{cta?.item.label}</div>
              </div>
            </div>
            <ul className={styles.validation}>
              {validation.length === 0 && (
                <li className={styles.ok}>검증 통과</li>
              )}
              {validation.map((v) => (
                <li
                  key={`${v.code}-${v.path}`}
                  className={
                    v.level === "error"
                      ? styles.error
                      : v.level === "warn"
                        ? styles.warn
                        : undefined
                  }
                >
                  [{v.level}] {v.message}
                </li>
              ))}
            </ul>
            <div className={styles.actions}>
              <button
                type="button"
                disabled={pending}
                onClick={() => save("draft")}
              >
                초안 저장
              </button>
              <button
                type="button"
                className={styles.primary}
                disabled={pending}
                onClick={() => save("publish")}
              >
                게시하기
              </button>
            </div>
            {message && <p className={styles.msg}>{message}</p>}
            {handle && (
              <p className={styles.note}>
                공개 페이지와 동일 렌더러:{" "}
                <a href={`/${handle}`} target="_blank" rel="noreferrer">
                  /{handle}
                </a>
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
