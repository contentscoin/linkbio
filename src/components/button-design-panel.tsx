"use client";

import { useState, type CSSProperties } from "react";
import {
  BUTTON_HOVER_OPTIONS,
  BUTTON_RADIUS_OPTIONS,
  BUTTON_SHADOW_OPTIONS,
  BUTTON_SIZE_OPTIONS,
  BUTTON_STYLE_OPTIONS,
  type BioButtonShadow,
  type BioButtonStyle,
  type BioEffectCard,
  type BioRadius,
  type BioSize,
} from "@/lib/page-design";
import { ACCENT_PRESETS } from "@/lib/design-templates";

type ButtonDesignPanelProps = {
  accent: string;
  buttonStyle: BioButtonStyle;
  buttonShadow: BioButtonShadow;
  radius: BioRadius;
  size: BioSize;
  effectCard: BioEffectCard;
  buttonFill: string;
  buttonText: string;
};

export function ButtonDesignPanel({
  accent,
  buttonStyle: initialStyle,
  buttonShadow: initialShadow,
  radius: initialRadius,
  size: initialSize,
  effectCard: initialHover,
  buttonFill,
  buttonText,
}: ButtonDesignPanelProps) {
  const [style, setStyle] = useState(initialStyle);
  const [shadow, setShadow] = useState(initialShadow);
  const [radius, setRadius] = useState(initialRadius);
  const [size, setSize] = useState(initialSize);
  const [hover, setHover] = useState(initialHover);
  const [fill, setFill] = useState(buttonFill);
  const [text, setText] = useState(buttonText);

  const previewFill = fill || accent || "#2d6a4f";
  const previewText = text || (style === "solid" ? "#ffffff" : "#16281d");
  const previewClass = [
    "btn-preview",
    `btn-preview--${style}`,
    `btn-preview-radius--${radius}`,
    `btn-preview-size--${size}`,
    `btn-preview-shadow--${shadow}`,
  ].join(" ");
  const previewStyle = {
    ["--preview-fill"]: previewFill,
    ["--preview-text"]: previewText,
    ["--preview-accent"]: accent,
  } as CSSProperties;

  return (
    <div className="button-design">
      <div className="btn-preview-stage" aria-hidden="true">
        <div className={previewClass} style={previewStyle}>
          버튼 미리보기
        </div>
        <div
          className={[previewClass, "btn-preview--secondary"].join(" ")}
          style={previewStyle}
        >
          보조 버튼
        </div>
      </div>

      <div className="field">
        <label>버튼 스타일</label>
        <div className="pick pick--button">
          {BUTTON_STYLE_OPTIONS.map((opt) => (
            <label key={opt.id}>
              <input
                className="pick-input"
                type="radio"
                name="buttonStyle"
                value={opt.id}
                checked={opt.id === style}
                onChange={() => setStyle(opt.id)}
              />
              <span className="pick-tile">
                <span
                  className={`btn-swatch btn-swatch--${opt.id}`}
                  style={{ ["--swatch-accent" as string]: accent }}
                />
                <span className="pick-name">{opt.label}</span>
                <span className="pick-layout">{opt.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <label>모양 (모서리)</label>
        <div className="seg">
          {BUTTON_RADIUS_OPTIONS.map((opt) => (
            <label key={opt.id} className="seg-label">
              <input
                className="pick-input"
                type="radio"
                name="radius"
                value={opt.id}
                checked={opt.id === radius}
                onChange={() => setRadius(opt.id)}
              />
              <span className="seg-btn" role="presentation">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <label>크기</label>
        <div className="seg">
          {BUTTON_SIZE_OPTIONS.map((opt) => (
            <label key={opt.id} className="seg-label">
              <input
                className="pick-input"
                type="radio"
                name="size"
                value={opt.id}
                checked={opt.id === size}
                onChange={() => setSize(opt.id)}
              />
              <span className="seg-btn" role="presentation">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <label>그림자</label>
        <div className="seg">
          {BUTTON_SHADOW_OPTIONS.map((opt) => (
            <label key={opt.id} className="seg-label">
              <input
                className="pick-input"
                type="radio"
                name="buttonShadow"
                value={opt.id}
                checked={opt.id === shadow}
                onChange={() => setShadow(opt.id)}
              />
              <span className="seg-btn" role="presentation">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <label>호버 효과</label>
        <div className="seg">
          {BUTTON_HOVER_OPTIONS.map((opt) => (
            <label key={opt.id} className="seg-label">
              <input
                className="pick-input"
                type="radio"
                name="effectCard"
                value={opt.id}
                checked={opt.id === hover}
                onChange={() => setHover(opt.id)}
              />
              <span className="seg-btn" role="presentation">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="buttonFill">버튼 배경색 (선택)</label>
        <div className="accents" style={{ marginBottom: 10 }}>
          {ACCENT_PRESETS.map((color) => (
            <button
              key={`fill-${color}`}
              className="accent-btn"
              type="button"
              aria-label={`버튼 배경 ${color}`}
              aria-pressed={fill.toLowerCase() === color.toLowerCase()}
              style={{ background: color }}
              onClick={() => setFill(color)}
            />
          ))}
        </div>
        <input
          id="buttonFill"
          name="buttonFill"
          type="text"
          value={fill}
          onChange={(e) => setFill(e.target.value)}
          placeholder="비우면 테마/액센트 기본값"
        />
      </div>

      <div className="field">
        <label htmlFor="buttonText">버튼 글자색 (선택)</label>
        <div className="accents" style={{ marginBottom: 10 }}>
          {["#ffffff", "#111111", "#16281d", accent].map((color) => (
            <button
              key={`text-${color}`}
              className="accent-btn"
              type="button"
              aria-label={`버튼 글자 ${color}`}
              aria-pressed={text.toLowerCase() === color.toLowerCase()}
              style={{ background: color }}
              onClick={() => setText(color)}
            />
          ))}
        </div>
        <input
          id="buttonText"
          name="buttonText"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="비우면 자동"
        />
      </div>
    </div>
  );
}
