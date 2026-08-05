"use client";

import { useMemo, useState } from "react";
import {
  DESIGN_TEMPLATES,
  TEMPLATE_CATEGORIES,
  THEME_OPTIONS,
  type TemplateCategory,
} from "@/lib/design-templates";

export function TemplatePicker({
  currentTemplateId,
}: {
  currentTemplateId: string;
}) {
  const [category, setCategory] = useState<TemplateCategory | "all">("all");

  const templates = useMemo(() => {
    if (category === "all") return DESIGN_TEMPLATES;
    return DESIGN_TEMPLATES.filter((t) => t.category === category);
  }, [category]);

  return (
    <div>
      <div className="seg" style={{ marginBottom: 14 }}>
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className="seg-btn"
            aria-pressed={category === cat.id}
            onClick={() => setCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="pick">
        {templates.map((template) => (
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
      {templates.length === 0 ? (
        <p className="hint">이 카테고리에 템플릿이 없습니다.</p>
      ) : null}
    </div>
  );
}
