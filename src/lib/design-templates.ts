import type { PageDesign } from "@/lib/page-design";

export type TemplateCategory =
  | "simple"
  | "creator"
  | "brand"
  | "portfolio"
  | "commerce";

export type DesignTemplate = {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  theme: string;
  accent: string;
  design: PageDesign;
  customCssSnippet?: string;
};

export const TEMPLATE_CATEGORIES: Array<{
  id: TemplateCategory | "all";
  label: string;
}> = [
  { id: "all", label: "전체" },
  { id: "simple", label: "심플/공지" },
  { id: "creator", label: "크리에이터" },
  { id: "brand", label: "기업/브랜드" },
  { id: "portfolio", label: "포트폴리오" },
  { id: "commerce", label: "커머스" },
];

export const DESIGN_TEMPLATES: DesignTemplate[] = [
  {
    id: "fairway",
    name: "페어웨이",
    description: "밝은 그린 필드. 기본 OMO Bio.",
    category: "simple",
    theme: "fairway",
    accent: "#2d6a4f",
    design: {
      layout: "stack",
      pattern: "none",
      buttonStyle: "elevated",
      buttonShadow: "soft",
      size: "normal",
      radius: "round",
      font: "sans",
      effectCard: "lift",
    },
  },
  {
    id: "paper-note",
    name: "페이퍼 노트",
    description: "종이 질감의 심플 공지형.",
    category: "simple",
    theme: "paper",
    accent: "#c45c26",
    design: {
      layout: "stack",
      pattern: "waves",
      buttonStyle: "soft",
      buttonShadow: "none",
      size: "normal",
      radius: "soft",
      font: "serif",
      effectCard: "lift",
    },
  },
  {
    id: "noir-glass",
    name: "느와르 글래스",
    description: "야간/크리에이터용 글래스 버튼.",
    category: "creator",
    theme: "noir",
    accent: "#e8c547",
    design: {
      layout: "stack",
      pattern: "grain",
      motion: "pulse",
      effect: "vignette",
      buttonStyle: "glass",
      buttonShadow: "float",
      size: "normal",
      radius: "soft",
      font: "sans",
      effectCard: "glow",
      scrim: 0.35,
    },
  },
  {
    id: "aurora-glow",
    name: "오로라",
    description: "크리에이터용 글로우·샤인 호버.",
    category: "creator",
    theme: "aurora",
    accent: "#7c5cff",
    design: {
      layout: "stack",
      pattern: "none",
      effect: "glow",
      buttonStyle: "glass",
      buttonShadow: "soft",
      size: "roomy",
      radius: "pill",
      font: "sans",
      effectCard: "shine",
    },
  },
  {
    id: "photo-hero",
    name: "포토 히어로",
    description: "배경 이미지 위 알약형 버튼.",
    category: "creator",
    theme: "noir",
    accent: "#ffffff",
    design: {
      layout: "stack",
      pattern: "none",
      effect: "spotlight",
      buttonStyle: "glass",
      buttonShadow: "float",
      buttonFill: "rgba(255,255,255,0.18)",
      buttonText: "#ffffff",
      size: "roomy",
      radius: "pill",
      font: "sans",
      effectCard: "shine",
      scrim: 0.45,
    },
    customCssSnippet: `.bio-avatar{width:112px;height:112px;border:3px solid color-mix(in srgb,var(--accent) 70%,#fff)}
.bio-name{text-shadow:0 2px 18px #0008}`,
  },
  {
    id: "editorial-serif",
    name: "에디토리얼",
    description: "브랜드·매거진형 아웃라인 버튼.",
    category: "brand",
    theme: "editorial",
    accent: "#8b4513",
    design: {
      layout: "stack",
      pattern: "none",
      buttonStyle: "outline",
      buttonShadow: "none",
      size: "roomy",
      radius: "sharp",
      font: "serif",
      effectCard: "none",
    },
  },
  {
    id: "brutal-sticker",
    name: "브루탈 스티커",
    description: "강한 브랜드 임팩트·스티커 버튼.",
    category: "brand",
    theme: "brutal",
    accent: "#ff3b30",
    design: {
      layout: "stack",
      pattern: "stripes",
      buttonStyle: "sticker",
      buttonShadow: "hard",
      size: "normal",
      radius: "sharp",
      font: "sans",
      effectCard: "press",
    },
  },
  {
    id: "bento-board",
    name: "벤토 보드",
    description: "포트폴리오·링크 많은 2열 그리드.",
    category: "portfolio",
    theme: "bento",
    accent: "#2563eb",
    design: {
      layout: "bento",
      pattern: "dots",
      buttonStyle: "elevated",
      buttonShadow: "soft",
      size: "normal",
      radius: "round",
      font: "sans",
      effectCard: "tilt",
    },
  },
  {
    id: "terminal-code",
    name: "터미널 코드",
    description: "개발자 포트폴리오용 리스트 버튼.",
    category: "portfolio",
    theme: "terminal",
    accent: "#3dd68c",
    design: {
      layout: "list",
      pattern: "grid",
      motion: "scan",
      effect: "scanlines",
      buttonStyle: "ghost",
      buttonShadow: "none",
      size: "compact",
      radius: "sharp",
      font: "mono",
      effectCard: "wipe",
    },
    customCssSnippet: `.bio-head{border-left:3px solid var(--accent);padding-left:14px}
.bio-link-title{letter-spacing:-.02em}`,
  },
  {
    id: "commerce-solid",
    name: "커머스 솔리드",
    description: "구매 CTA용 풀컬러 솔리드·알약 버튼.",
    category: "commerce",
    theme: "bento",
    accent: "#e11d48",
    design: {
      layout: "stack",
      pattern: "none",
      buttonStyle: "solid",
      buttonShadow: "float",
      buttonFill: "#e11d48",
      buttonText: "#ffffff",
      size: "roomy",
      radius: "pill",
      font: "sans",
      effectCard: "lift",
    },
  },
];

/** Base CSS themes available on public pages (`data-theme`). */
export const THEME_OPTIONS = [
  { id: "fairway", name: "페어웨이", colors: ["#d8ecf7", "#2d6a4f", "#fbfaf4"] },
  { id: "bento", name: "벤토", colors: ["#f4f5f7", "#2563eb", "#ffffff"] },
  { id: "brutal", name: "브루탈", colors: ["#f5f0e8", "#ff3b30", "#111111"] },
  { id: "editorial", name: "에디토리얼", colors: ["#fdfbf7", "#8b4513", "#f5f1e8"] },
  { id: "noir", name: "느와르", colors: ["#0c0c0d", "#e8c547", "#16161a"] },
  { id: "aurora", name: "오로라", colors: ["#0f0a1e", "#7c5cff", "#2ec5ce"] },
  { id: "terminal", name: "터미널", colors: ["#0a0e0a", "#3dd68c", "#101610"] },
  { id: "paper", name: "페이퍼", colors: ["#f6f1e4", "#c45c26", "#fffdf7"] },
] as const;

export const ACCENT_PRESETS = [
  "#2d6a4f",
  "#2563eb",
  "#7c5cff",
  "#e8c547",
  "#ff3b30",
  "#e11d48",
  "#c45c26",
  "#3dd68c",
  "#111111",
  "#ffffff",
] as const;

export function listDesignTemplates() {
  return DESIGN_TEMPLATES.map(
    ({ id, name, description, theme, accent, category }) => ({
      id,
      name,
      description,
      theme,
      accent,
      category,
    }),
  );
}

export function getDesignTemplate(id: string) {
  return DESIGN_TEMPLATES.find((t) => t.id === id) ?? null;
}

export function applyTemplateToDesign(
  template: DesignTemplate,
  options?: {
    keepAvatar?: boolean;
    keepBackground?: boolean;
    current?: PageDesign;
  },
): PageDesign {
  const current = options?.current ?? {};
  const next: PageDesign = {
    ...template.design,
    templateId: template.id,
    customCss: template.customCssSnippet ?? template.design.customCss,
  };
  if (options?.keepAvatar && current.avatarImageUrl) {
    next.avatarImageUrl = current.avatarImageUrl;
  }
  if (options?.keepBackground && current.backgroundImageUrl) {
    next.backgroundImageUrl = current.backgroundImageUrl;
  }
  if (current.wizard) {
    next.wizard = current.wizard;
  }
  return next;
}
