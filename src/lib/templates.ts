export const TEMPLATE_IDS = [
  "field",
  "studio",
  "coral",
  "dusk",
  "fairway",
  "ink",
  "meadow",
  "tournament",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export type ButtonStyle = "soft" | "solid" | "outline" | "pill";
export type BackgroundKind = "gradient" | "solid" | "image" | "pattern";
export type FontPair = "editorial" | "sport" | "minimal" | "night";
export type LayoutStyle = "stack" | "compact" | "cards";

export type PageDesign = {
  buttonStyle: ButtonStyle;
  backgroundKind: BackgroundKind;
  backgroundValue: string;
  accentColor: string;
  textColor: string;
  mutedColor: string;
  fontPair: FontPair;
  layout: LayoutStyle;
  customCss: string;
};

export type TemplateDefinition = {
  id: TemplateId;
  name: string;
  description: string;
  preview: {
    sky: string;
    turf: string;
  };
  design: PageDesign;
};

export const defaultDesign: PageDesign = {
  buttonStyle: "solid",
  backgroundKind: "gradient",
  backgroundValue:
    "radial-gradient(circle at 12% 0%, rgba(230, 184, 76, 0.28), transparent 42%), linear-gradient(165deg, #e8f0ea 0%, #f3f7f2 48%, #dfe9e2 100%)",
  accentColor: "#1a5c45",
  textColor: "#14241c",
  mutedColor: "#5b6d63",
  fontPair: "editorial",
  layout: "stack",
  customCss: "",
};

export const templates: Record<TemplateId, TemplateDefinition> = {
  field: {
    id: "field",
    name: "Field",
    description: "아침 페어웨이 — 초록 잔디와 골드 라이트.",
    preview: { sky: "#d7ebe0", turf: "#1a5c45" },
    design: { ...defaultDesign },
  },
  studio: {
    id: "studio",
    name: "Studio",
    description: "깨끗하고 또렷한 에디토리얼 스튜디오.",
    preview: { sky: "#eceff1", turf: "#24332c" },
    design: {
      ...defaultDesign,
      accentColor: "#24332c",
      backgroundValue:
        "linear-gradient(180deg, #f7f8f6 0%, #e9eeea 100%)",
      buttonStyle: "outline",
      fontPair: "minimal",
      layout: "compact",
    },
  },
  coral: {
    id: "coral",
    name: "Ember",
    description: "석양 앰버 포인트 — 골프데이 무드.",
    preview: { sky: "#f6e6d4", turf: "#b45309" },
    design: {
      ...defaultDesign,
      accentColor: "#b45309",
      backgroundValue:
        "radial-gradient(circle at 80% 0%, rgba(180, 83, 9, 0.22), transparent 36%), linear-gradient(160deg, #fff6ea, #f3ebe0)",
      buttonStyle: "soft",
      fontPair: "sport",
    },
  },
  dusk: {
    id: "dusk",
    name: "Dusk",
    description: "해질녘 코스 — 딥 그린과 밤 공기.",
    preview: { sky: "#1e2f28", turf: "#7cb89a" },
    design: {
      ...defaultDesign,
      accentColor: "#7cb89a",
      textColor: "#e8f2ec",
      mutedColor: "#9bb5a8",
      backgroundKind: "gradient",
      backgroundValue:
        "radial-gradient(circle at 30% 10%, rgba(124, 184, 154, 0.22), transparent 40%), linear-gradient(180deg, #132019 0%, #1b2c24 55%, #0f1814 100%)",
      buttonStyle: "soft",
      fontPair: "night",
      layout: "cards",
    },
  },
  fairway: {
    id: "fairway",
    name: "Fairway",
    description: "와이드 페어웨이 패턴 배경.",
    preview: { sky: "#cfe3d4", turf: "#0f7a53" },
    design: {
      ...defaultDesign,
      accentColor: "#0f7a53",
      backgroundKind: "pattern",
      backgroundValue: "fairway",
      buttonStyle: "pill",
      fontPair: "sport",
    },
  },
  ink: {
    id: "ink",
    name: "Ink",
    description: "잉크 블랙 하이콘트라스트.",
    preview: { sky: "#111614", turf: "#e6b84c" },
    design: {
      ...defaultDesign,
      accentColor: "#e6b84c",
      textColor: "#f4f7f4",
      mutedColor: "#a7b5ad",
      backgroundKind: "solid",
      backgroundValue: "#111614",
      buttonStyle: "outline",
      fontPair: "night",
      layout: "stack",
    },
  },
  meadow: {
    id: "meadow",
    name: "Meadow",
    description: "부드러운 미드데이 잔디 톤.",
    preview: { sky: "#e4f1d9", turf: "#3f6b3a" },
    design: {
      ...defaultDesign,
      accentColor: "#3f6b3a",
      backgroundValue:
        "linear-gradient(145deg, #f2f8ea 0%, #e5efd8 45%, #d5e4c6 100%)",
      buttonStyle: "soft",
      fontPair: "editorial",
      layout: "cards",
    },
  },
  tournament: {
    id: "tournament",
    name: "Tournament",
    description: "대회 데이 — 선명하고 힘 있는 구성.",
    preview: { sky: "#0c2e24", turf: "#f0c14a" },
    design: {
      ...defaultDesign,
      accentColor: "#f0c14a",
      textColor: "#f7fff8",
      mutedColor: "#b7cfc2",
      backgroundKind: "gradient",
      backgroundValue:
        "linear-gradient(160deg, #0c2e24 0%, #134536 48%, #0a221b 100%)",
      buttonStyle: "solid",
      fontPair: "sport",
      layout: "compact",
    },
  },
};

export function isTemplateId(value: string): value is TemplateId {
  return (TEMPLATE_IDS as readonly string[]).includes(value);
}

export function getTemplate(id: string): TemplateDefinition {
  if (isTemplateId(id)) return templates[id];
  return templates.field;
}

export function resolveDesign(
  theme: string,
  stored: Partial<PageDesign> | null | undefined,
): PageDesign {
  const base = getTemplate(theme).design;
  if (!stored) return { ...base };
  return {
    ...base,
    ...stored,
    customCss: stored.customCss ?? base.customCss,
  };
}
