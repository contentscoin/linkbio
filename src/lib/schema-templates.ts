import type { PageSchema } from "@/lib/page-schema";

export type SchemaTemplateMeta = {
  id: string;
  name: string;
  description: string;
  category:
    | "brand"
    | "corporate"
    | "personal"
    | "product"
    | "portfolio"
    | "minimal"
    | "photo";
  thumbnail: string;
  theme: string;
  contentWidth: PageSchema["contentWidth"];
  responsiveRules: {
    contentMaxWidth: number;
    serviceColumns: 2;
    serviceMobileColumns: 2;
    shortcutsColumns: 1;
    ctaFullWidth: true;
    equalCardHeight: true;
    minTouchTargetPx: 44;
    mobilePaddingPx: [16, 24];
  };
  schema: PageSchema;
};

const FMGS_SCHEMA: PageSchema = {
  version: 1,
  templateId: "fmgs-premium",
  theme: "navy-lime",
  contentWidth: 765,
  brand: {
    displayName: "FMGS",
    showHandle: false,
    showAvatar: false,
  },
  sections: [
    {
      type: "hero",
      headline: "골프 마케팅의 새로운 기준을 만듭니다.",
      headlineSegments: [
        { text: "골프 마케팅의", breakAfter: true },
        { text: "새로운 기준", accent: true },
        { text: "을 만듭니다." },
      ],
      stats: [
        { value: "58만", label: "골퍼 DB" },
        { value: "150+", label: "파트너 코스" },
        { value: "연 50+", label: "대회" },
      ],
      heroGraphic: "golf",
    },
    {
      type: "cta",
      id: "cta",
      item: {
        label: "무료 상담 신청",
        url: "https://example.com/consult",
        secondaryText: "맞춤 제안과 견적을 빠르게 받아보세요.",
        subtitlePlacement: "trailing",
        showDivider: true,
        showArrow: true,
        arrowStyle: "circle",
      },
    },
    {
      type: "serviceGrid",
      id: "services",
      title: "핵심 서비스",
      columns: 2,
      mobileColumns: 2,
      gap: 12,
      items: [
        {
          id: "fmg",
          label: "파미골 (FMG)",
          url: "https://example.com/fmg",
          iconKey: "golf",
          badge: "대표 서비스",
          span: 1,
          mobileSpan: 1,
        },
        {
          id: "luckyball",
          label: "FMG Luckyball",
          url: "https://example.com/luckyball",
          iconKey: "ball",
          span: 1,
          mobileSpan: 1,
        },
        {
          id: "members",
          label: "FMG Members",
          url: "https://example.com/members",
          iconKey: "members",
          span: 1,
          mobileSpan: 1,
        },
        {
          id: "ceo-golf",
          label: "FMG CEO Golf",
          url: "https://example.com/ceo-golf",
          iconKey: "flag",
          span: 1,
          mobileSpan: 1,
        },
      ],
    },
    {
      type: "shortcuts",
      id: "shortcuts",
      title: "바로가기",
      items: [
        {
          id: "ads",
          label: "광고 & SI",
          url: "https://example.com/ads",
          iconKey: "ads",
        },
        {
          id: "portfolio",
          label: "포트폴리오",
          url: "https://example.com/portfolio",
          iconKey: "portfolio",
        },
        {
          id: "about",
          label: "회사 소개",
          url: "https://example.com/about",
          iconKey: "building",
        },
        {
          id: "kakao",
          label: "카카오톡 상담",
          url: "https://example.com/kakao",
          iconKey: "kakao",
        },
        {
          id: "home",
          label: "FMGS 홈",
          url: "https://example.com/",
          iconKey: "home",
        },
      ],
    },
  ],
  designOptions: {
    font: "sans",
    radius: "round",
    buttonStyle: "elevated",
    desktopFontSize: 15,
    mobileFontSize: 14,
    lineHeight: 1.45,
    letterSpacing: "-0.02em",
  },
};

function baseTemplate(
  partial: Omit<SchemaTemplateMeta, "responsiveRules" | "schema"> & {
    schema: PageSchema;
  },
): SchemaTemplateMeta {
  return {
    ...partial,
    responsiveRules: {
      contentMaxWidth: 765,
      serviceColumns: 2,
      serviceMobileColumns: 2,
      shortcutsColumns: 1,
      ctaFullWidth: true,
      equalCardHeight: true,
      minTouchTargetPx: 44,
      mobilePaddingPx: [16, 24],
    },
  };
}

export const SCHEMA_TEMPLATES: SchemaTemplateMeta[] = [
  baseTemplate({
    id: "fmgs-premium",
    name: "FMGS Premium",
    description: "골프/브랜드용 2×2 서비스 + 라임 CTA. 시안형 고정 반응형.",
    category: "brand",
    thumbnail: "/designer/thumbs/fmgs-premium.svg",
    theme: "navy-lime",
    contentWidth: 765,
    schema: FMGS_SCHEMA,
  }),
  baseTemplate({
    id: "corporate-grid",
    name: "Corporate Grid",
    description: "기업용 2열 서비스 그리드와 명확한 CTA.",
    category: "corporate",
    thumbnail: "/designer/thumbs/corporate-grid.svg",
    theme: "corporate",
    contentWidth: "mobile",
    schema: {
      ...FMGS_SCHEMA,
      templateId: "corporate-grid",
      theme: "corporate",
      brand: { displayName: "Company", showHandle: false, showAvatar: false },
      sections: FMGS_SCHEMA.sections.map((s) =>
        s.type === "hero"
          ? {
              ...s,
              headline: "비즈니스의 다음 단계를 연결합니다.",
              headlineSegments: undefined,
              stats: [
                { value: "120+", label: "고객사" },
                { value: "98%", label: "재계약" },
                { value: "24h", label: "응답" },
              ],
              heroGraphic: "none",
            }
          : s,
      ),
    },
  }),
  baseTemplate({
    id: "personal-branding",
    name: "Personal Branding",
    description: "개인 브랜드·크리에이터용 심플 스택.",
    category: "personal",
    thumbnail: "/designer/thumbs/personal.svg",
    theme: "fairway",
    contentWidth: "mobile",
    schema: {
      version: 1,
      templateId: "personal-branding",
      theme: "fairway",
      contentWidth: "mobile",
      brand: { showHandle: true, showAvatar: true },
      sections: [
        {
          type: "hero",
          headline: "나를 소개하는 한 페이지",
          stats: [],
          heroGraphic: "none",
        },
        {
          type: "cta",
          item: {
            label: "문의하기",
            url: "https://example.com/contact",
            showArrow: true,
            arrowStyle: "circle",
            showDivider: true,
            subtitlePlacement: "body",
            secondaryText: "협업·강의·상담 요청",
          },
        },
        {
          type: "shortcuts",
          title: "링크",
          items: [
            { id: "instagram", label: "Instagram", url: "https://instagram.com", iconKey: "portfolio" },
            { id: "youtube", label: "YouTube", url: "https://youtube.com", iconKey: "ads" },
          ],
        },
      ],
    },
  }),
  baseTemplate({
    id: "product-launch",
    name: "Product Launch",
    description: "제품 출시용 히어로 + 기능 카드.",
    category: "product",
    thumbnail: "/designer/thumbs/product.svg",
    theme: "corporate",
    contentWidth: "mobile",
    schema: {
      ...FMGS_SCHEMA,
      templateId: "product-launch",
      theme: "corporate",
      brand: { displayName: "Product", showHandle: false, showAvatar: false },
    },
  }),
  baseTemplate({
    id: "portfolio",
    name: "Portfolio",
    description: "포트폴리오·작품 모음.",
    category: "portfolio",
    thumbnail: "/designer/thumbs/portfolio.svg",
    theme: "noir",
    contentWidth: "mobile",
    schema: {
      ...FMGS_SCHEMA,
      templateId: "portfolio",
      theme: "noir",
    },
  }),
  baseTemplate({
    id: "minimal-link",
    name: "Minimal Link",
    description: "최소 구성 링크 리스트.",
    category: "minimal",
    thumbnail: "/designer/thumbs/minimal.svg",
    theme: "fairway",
    contentWidth: "mobile",
    schema: {
      version: 1,
      templateId: "minimal-link",
      theme: "fairway",
      contentWidth: "mobile",
      brand: { showHandle: true, showAvatar: true },
      sections: [
        {
          type: "shortcuts",
          title: "Links",
          items: [
            { id: "main", label: "메인 사이트", url: "https://example.com", iconKey: "home" },
          ],
        },
      ],
    },
  }),
  baseTemplate({
    id: "photo-hero",
    name: "Photo Hero",
    description: "배경 이미지 중심 히어로.",
    category: "photo",
    thumbnail: "/designer/thumbs/photo.svg",
    theme: "noir",
    contentWidth: "mobile",
    schema: {
      ...FMGS_SCHEMA,
      templateId: "photo-hero",
      theme: "noir",
      designOptions: {
        ...FMGS_SCHEMA.designOptions,
        effect: "vignette",
      },
    },
  }),
];

export function listSchemaTemplates() {
  return SCHEMA_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    thumbnail: t.thumbnail,
    theme: t.theme,
    contentWidth: t.contentWidth,
    responsiveRules: t.responsiveRules,
  }));
}

export function getSchemaTemplate(id: string) {
  return SCHEMA_TEMPLATES.find((t) => t.id === id) ?? null;
}

export function cloneTemplateSchema(
  id: string,
  patch?: Partial<PageSchema>,
): PageSchema | null {
  const tpl = getSchemaTemplate(id);
  if (!tpl) return null;
  return {
    ...structuredClone(tpl.schema),
    ...patch,
    templateId: tpl.id,
    version: 1,
  };
}
