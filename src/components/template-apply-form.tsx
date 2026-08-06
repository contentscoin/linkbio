"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  DESIGN_TEMPLATES,
  TEMPLATE_CATEGORIES,
  THEME_OPTIONS,
  type TemplateCategory,
} from "@/lib/design-templates";

function templatesFor(category: TemplateCategory | "all") {
  if (category === "all") return DESIGN_TEMPLATES;
  return DESIGN_TEMPLATES.filter((t) => t.category === category);
}

export function TemplateApplyForm({
  currentTemplateId,
}: {
  currentTemplateId: string;
}) {
  const initial =
    DESIGN_TEMPLATES.find((t) => t.id === currentTemplateId)?.id ??
    DESIGN_TEMPLATES[0]?.id ??
    "fairway";
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const [selectedId, setSelectedId] = useState(initial);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const templates = useMemo(() => templatesFor(category), [category]);

  function changeCategory(next: TemplateCategory | "all") {
    setCategory(next);
    const list = templatesFor(next);
    if (list.length === 0) return;
    if (!list.some((t) => t.id === selectedId)) {
      setSelectedId(list[0]!.id);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    setNotice(null);
    if (!selectedId) {
      event.preventDefault();
      setNotice("디자인 템플릿을 선택하세요.");
      return;
    }
    setPending(true);
  }

  return (
    <form
      action="/api/admin/apply-template"
      method="post"
      onSubmit={onSubmit}
    >
      {/* Authoritative value — radios are UI-only (no name). */}
      <input type="hidden" name="templateId" value={selectedId} />

      <div className="seg" style={{ marginBottom: 14 }}>
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className="seg-btn"
            aria-pressed={category === cat.id}
            onClick={() => changeCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="pick" role="radiogroup" aria-label="디자인 템플릿">
        {templates.map((template) => (
          <label key={template.id}>
            <input
              className="pick-input"
              type="radio"
              checked={template.id === selectedId}
              onChange={() => setSelectedId(template.id)}
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

      {templates.length === 0 ? (
        <p className="hint">이 카테고리에 템플릿이 없습니다.</p>
      ) : (
        <p className="hint" style={{ marginTop: 8 }}>
          선택됨:{" "}
          {DESIGN_TEMPLATES.find((t) => t.id === selectedId)?.name ??
            selectedId}
        </p>
      )}

      {notice ? <div className="auth-notice">{notice}</div> : null}

      <button
        className="btn btn--primary"
        type="submit"
        disabled={pending || !selectedId}
      >
        {pending ? "적용 중…" : "템플릿 적용"}
      </button>
    </form>
  );
}
