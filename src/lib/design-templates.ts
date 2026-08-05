import type { PageDesign } from "@/lib/page-design";

export type DesignTemplate = {
  id: string;
  name: string;
  description: string;
  theme: string;
  accent: string;
  design: PageDesign;
  customCssSnippet?: string;
};

export const DESIGN_TEMPLATES: DesignTemplate[] = [
  {
    id: "fairway",
    name: "페어웨이",
    description: "밝은 그린 필드 분위기. 기본 OMO Bio 테마.",
    theme: "fairway",
    accent: "#2d6a4f",
    design: {
      layout: "stack",
      pattern: "none",
      card: "elevated",
      size: "normal",
      radius: "round",
      font: "sans",
      effectCard: "lift",
    },
  },
  {
    id: "noir-glass",
    name: "느와르 글래스",
    description: "어두운 배경 + 글래스 카드. 야간/크리에이터 프로필용.",
    theme: "noir",
    accent: "#e8c547",
    design: {
      layout: "stack",
      pattern: "grain",
      motion: "pulse",
      effect: "vignette",
      card: "glass",
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
    description: "보라/시안 오로라 배경과 글로우 호버.",
    theme: "aurora",
    accent: "#7c5cff",
    design: {
      layout: "stack",
      pattern: "none",
      effect: "glow",
      card: "glass",
      size: "roomy",
      radius: "round",
      font: "sans",
      effectCard: "shine",
    },
  },
  {
    id: "terminal-code",
    name: "터미널 코드",
    description: "개발자용 모노스페이스. 코드 스니펫 CSS 포함.",
    theme: "terminal",
    accent: "#3dd68c",
    design: {
      layout: "list",
      pattern: "grid",
      motion: "scan",
      effect: "scanlines",
      card: "flat",
      size: "compact",
      radius: "sharp",
      font: "mono",
      effectCard: "none",
    },
    customCssSnippet: `.bio-head{border-left:3px solid var(--accent);padding-left:14px}
.bio-link-title{letter-spacing:-.02em}`,
  },
  {
    id: "editorial-serif",
    name: "에디토리얼",
    description: "세리프 타이포와 잡지형 여백.",
    theme: "editorial",
    accent: "#8b4513",
    design: {
      layout: "stack",
      pattern: "none",
      card: "outline",
      size: "roomy",
      radius: "sharp",
      font: "serif",
      effectCard: "none",
    },
  },
  {
    id: "bento-board",
    name: "벤토 보드",
    description: "2열 그리드 레이아웃. 링크가 많을 때 적합.",
    theme: "bento",
    accent: "#2563eb",
    design: {
      layout: "bento",
      pattern: "dots",
      card: "elevated",
      size: "normal",
      radius: "round",
      font: "sans",
      effectCard: "tilt",
    },
  },
  {
    id: "brutal-sticker",
    name: "브루탈 스티커",
    description: "두꺼운 테두리와 스티커 카드.",
    theme: "brutal",
    accent: "#ff3b30",
    design: {
      layout: "stack",
      pattern: "stripes",
      card: "sticker",
      size: "normal",
      radius: "sharp",
      font: "sans",
      effectCard: "press",
    },
  },
  {
    id: "paper-note",
    name: "페이퍼 노트",
    description: "종이 질감과 손글씨 느낌.",
    theme: "paper",
    accent: "#c45c26",
    design: {
      layout: "stack",
      pattern: "waves",
      card: "solid",
      size: "normal",
      radius: "soft",
      font: "serif",
      effectCard: "lift",
    },
  },
  {
    id: "photo-hero",
    name: "포토 히어로",
    description: "배경 이미지 + 스크림. avatarImageUrl / backgroundImageUrl과 함께 사용.",
    theme: "noir",
    accent: "#ffffff",
    design: {
      layout: "stack",
      pattern: "none",
      effect: "spotlight",
      card: "glass",
      size: "roomy",
      radius: "pill",
      font: "sans",
      effectCard: "shine",
      scrim: 0.45,
    },
    customCssSnippet: `.bio-avatar{width:112px;height:112px;border:3px solid color-mix(in srgb,var(--accent) 70%,#fff)}
.bio-name{text-shadow:0 2px 18px #0008}`,
  },
];

export function listDesignTemplates() {
  return DESIGN_TEMPLATES.map(({ id, name, description, theme, accent }) => ({
    id,
    name,
    description,
    theme,
    accent,
  }));
}

export function getDesignTemplate(id: string) {
  return DESIGN_TEMPLATES.find((t) => t.id === id) ?? null;
}

export function applyTemplateToDesign(
  template: DesignTemplate,
  options?: { keepAvatar?: boolean; keepBackground?: boolean; current?: PageDesign },
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
