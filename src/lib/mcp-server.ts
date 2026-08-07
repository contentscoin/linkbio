import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { McpAuthResult } from "@/lib/mcp-auth";
import { runAgentAction, type AgentResult } from "@/lib/agent-ops";
import {
  PROFILE_DESIGNER_URI,
  profileDesignerWidgetHtml,
} from "@/lib/designer-widget";

function textResult(result: AgentResult) {
  const isError = result.ok === false;
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
    structuredContent: result as unknown as Record<string, unknown>,
    isError,
  };
}

function handleOptional(value: string | undefined) {
  return value && value.trim() ? value : undefined;
}

function resolveHandle(
  auth: Extract<McpAuthResult, { ok: true }>,
  handle?: string,
) {
  return handleOptional(handle) ?? (auth.scope === "page" ? auth.handle : "");
}

/** Build a per-request MCP server bound to the authenticated scope. */
export function createOmoBioMcpServer(
  auth: Extract<McpAuthResult, { ok: true }>,
) {
  const server = new McpServer({
    name: "omo-bio",
    version: "0.8.1",
  });

  const defaultHandle =
    auth.scope === "page"
      ? z.string().optional().describe(`기본값: ${auth.handle}`)
      : z.string().describe("페이지 handle");

  server.registerResource(
    "profile-designer",
    PROFILE_DESIGNER_URI,
    {
      description:
        "Bioomo interactive profile designer (template → content → design → preview/publish)",
      mimeType: "text/html;profile=mcp-app",
    },
    async () => ({
      contents: [
        {
          uri: PROFILE_DESIGNER_URI,
          mimeType: "text/html;profile=mcp-app",
          text: profileDesignerWidgetHtml({
            handle: auth.scope === "page" ? auth.handle : "",
            step: "guide",
          }),
          _meta: {
            ui: { prefersBorder: true },
          },
        },
      ],
    }),
  );

  server.registerTool(
    "get_page",
    {
      title: "페이지 조회",
      description: "프로필·링크·디자인 요약을 조회합니다.",
      inputSchema: { handle: defaultHandle },
    },
    async ({ handle }) =>
      textResult(
        await runAgentAction(auth, "get_page", {
          handle: handleOptional(handle) ?? (auth.scope === "page" ? auth.handle : ""),
        }),
      ),
  );

  server.registerTool(
    "update_profile",
    {
      title: "프로필 수정",
      description: "표시 이름, 소개, 테마, 액센트, 공개 여부를 수정합니다.",
      inputSchema: {
        handle: defaultHandle,
        displayName: z.string().optional(),
        bio: z.string().optional(),
        theme: z.string().optional(),
        accent: z.string().optional(),
        isPublished: z.boolean().optional(),
      },
    },
    async (args) =>
      textResult(
        await runAgentAction(auth, "update_profile", {
          ...args,
          handle:
            handleOptional(args.handle) ??
            (auth.scope === "page" ? auth.handle : ""),
        }),
      ),
  );

  server.registerTool(
    "upsert_link",
    {
      title: "링크 추가/수정",
      description:
        "링크 버튼을 만들거나 수정합니다. linkId가 있으면 label/url 없이 변경 필드만 부분 수정(이미지 아이콘·배지·레이아웃·span·cta 화살표 등). 신규 시 label+url 필수.",
      inputSchema: {
        handle: defaultHandle,
        linkId: z
          .string()
          .optional()
          .describe("있으면 부분 수정 모드 (지정한 필드만 패치)"),
        label: z.string().optional().describe("신규 생성 시 필수"),
        sublabel: z.string().nullable().optional(),
        url: z.string().optional().describe("신규 생성 시 필수"),
        featured: z.boolean().optional(),
        isVisible: z.boolean().optional(),
        sortOrder: z.number().optional(),
        span: z
          .number()
          .min(1)
          .max(3)
          .optional()
          .describe("그리드 가로 점유. 2면 한 줄 전체"),
        colSpan: z
          .number()
          .min(1)
          .max(3)
          .optional()
          .describe("span 별칭"),
        rowSpan: z.number().min(1).max(3).optional().describe("그리드 세로 점유"),
        mobileSpan: z
          .number()
          .min(1)
          .max(3)
          .optional()
          .describe("모바일 그리드 가로 점유"),
        variant: z
          .string()
          .nullable()
          .optional()
          .describe("card|full|spotlight|featured"),
        layout: z
          .enum(["horizontal", "vertical"])
          .optional()
          .describe("카드 내부 레이아웃"),
        cardLayout: z
          .enum(["horizontal", "vertical"])
          .optional()
          .describe("layout 별칭"),
        iconPlacement: z
          .enum(["leading", "top", "trailing"])
          .optional()
          .describe("아이콘 위치"),
        iconSize: z
          .number()
          .min(12)
          .max(96)
          .optional()
          .describe("아이콘 px 크기"),
        section: z.string().nullable().optional().describe("섹션/그룹 id"),
        groupId: z.string().nullable().optional().describe("section 별칭"),
        iconKey: z
          .string()
          .nullable()
          .optional()
          .describe(
            "내장 아이콘: chat|kakao|golf|ball|members|flag|ads|chart|building|home|portfolio|arrow",
          ),
        iconUrl: z
          .string()
          .nullable()
          .optional()
          .describe("커스텀 아이콘 https URL (iconKey보다 우선)"),
        iconImageUrl: z
          .string()
          .nullable()
          .optional()
          .describe("링크별 이미지 아이콘 https URL (SVG/PNG). iconKey보다 우선"),
        leadingIconUrl: z
          .string()
          .nullable()
          .optional()
          .describe("CTA 전용 leading 아이콘 https URL"),
        leadingIcon: z
          .string()
          .nullable()
          .optional()
          .describe("leadingIconUrl 별칭"),
        secondaryText: z
          .string()
          .nullable()
          .optional()
          .describe("CTA 보조문구 (subtitle)"),
        trailingText: z
          .string()
          .nullable()
          .optional()
          .describe("CTA 우측 문구"),
        subtitlePlacement: z
          .enum(["body", "trailing"])
          .optional()
          .describe("subtitle 위치"),
        badge: z
          .string()
          .nullable()
          .optional()
          .describe("카드 배지 텍스트, 예: 대표 서비스"),
        showArrow: z.boolean().optional().describe("우측 화살표 표시 여부"),
        arrowStyle: z
          .enum(["plain", "circle"])
          .optional()
          .describe("화살표 스타일"),
        arrowPosition: z
          .enum(["trailing", "top-right", "end"])
          .optional()
          .describe("화살표 위치"),
        showDivider: z
          .boolean()
          .optional()
          .describe("CTA 아이콘/텍스트 사이 세로 구분선"),
        trailingIcon: z
          .string()
          .nullable()
          .optional()
          .describe("화살표 대신 표시할 trailing 문자/심볼"),
        cardPadding: z
          .string()
          .nullable()
          .optional()
          .describe("카드 내부 패딩 (예: 12px 14px)"),
        padding: z.string().nullable().optional().describe("cardPadding 별칭"),
        cardMinHeight: z
          .number()
          .min(0)
          .max(480)
          .optional()
          .describe("카드 최소 높이(px)"),
        minHeight: z.number().min(0).max(480).optional(),
        cardHeight: z.number().min(0).max(640).optional(),
        height: z.number().min(0).max(640).optional(),
        aspectRatio: z.string().nullable().optional().describe("예: 1 / 1"),
        objectFit: z.enum(["contain", "cover"]).optional(),
        imageSize: z.number().min(0).max(96).optional(),
        imagePosition: z.enum(["top", "leading", "trailing"]).optional(),
        mobileCardMinHeight: z.number().min(0).max(480).optional(),
        mobileCardHeight: z.number().min(0).max(640).optional(),
        mobileCardPadding: z.string().nullable().optional(),
      },
    },
    async (args) =>
      textResult(
        await runAgentAction(auth, "upsert_link", {
          ...args,
          handle:
            handleOptional(args.handle) ??
            (auth.scope === "page" ? auth.handle : ""),
        }),
      ),
  );

  server.registerTool(
    "delete_link",
    {
      title: "링크 삭제",
      description: "linkId로 링크를 삭제합니다.",
      inputSchema: {
        handle: defaultHandle,
        linkId: z.string(),
      },
    },
    async (args) =>
      textResult(
        await runAgentAction(auth, "delete_link", {
          ...args,
          handle:
            handleOptional(args.handle) ??
            (auth.scope === "page" ? auth.handle : ""),
        }),
      ),
  );

  server.registerTool(
    "list_design_capabilities",
    {
      title: "디자인 편집 가능 항목",
      description:
        "MCP로 수정 가능한 design/link 필드, 아이콘 키, 레이아웃 레시피, 권장 워크플로를 반환합니다. 페이지를 바꾸기 전에 이 도구로 확인하세요.",
      inputSchema: {},
    },
    async () =>
      textResult(await runAgentAction(auth, "list_design_capabilities", {})),
  );

  server.registerTool(
    "start_profile_wizard",
    {
      title: "프로필생성도우미 시작",
      description:
        "질의응답으로 프로필을 완성하는 도우미를 시작합니다. MCP 연결 후 이 도구를 먼저 호출하세요.",
      inputSchema: { handle: defaultHandle },
    },
    async ({ handle }) =>
      textResult(
        await runAgentAction(auth, "start_profile_wizard", {
          handle: handleOptional(handle) ?? (auth.scope === "page" ? auth.handle : ""),
        }),
      ),
  );

  server.registerTool(
    "answer_profile_wizard",
    {
      title: "프로필생성도우미 답변",
      description:
        "현재(또는 stepId) 질문에 대한 사용자 답변을 제출하고 다음 단계로 진행합니다.",
      inputSchema: {
        handle: defaultHandle,
        answer: z.string().describe("사용자 답변"),
        stepId: z.string().optional().describe("생략 시 현재 단계"),
      },
    },
    async (args) =>
      textResult(
        await runAgentAction(auth, "answer_profile_wizard", {
          ...args,
          handle:
            handleOptional(args.handle) ??
            (auth.scope === "page" ? auth.handle : ""),
        }),
      ),
  );

  server.registerTool(
    "get_profile_wizard_status",
    {
      title: "프로필생성도우미 상태",
      description: "현재 위저드 진행 상태와 다음 질문을 조회합니다.",
      inputSchema: { handle: defaultHandle },
    },
    async ({ handle }) =>
      textResult(
        await runAgentAction(auth, "get_profile_wizard_status", {
          handle: handleOptional(handle) ?? (auth.scope === "page" ? auth.handle : ""),
        }),
      ),
  );

  server.registerTool(
    "list_design_templates",
    {
      title: "디자인 템플릿 목록",
      description: "적용 가능한 프로필 디자인 템플릿을 나열합니다.",
      inputSchema: {},
    },
    async () => textResult(await runAgentAction(auth, "list_design_templates", {})),
  );

  server.registerTool(
    "apply_design_template",
    {
      title: "디자인 템플릿 적용",
      description:
        "템플릿으로 테마·레이아웃·카드·패턴·(선택) CSS 스니펫을 한 번에 적용합니다.",
      inputSchema: {
        handle: defaultHandle,
        templateId: z
          .string()
          .describe("예: fairway, noir-glass, terminal-code, photo-hero"),
        accent: z.string().optional(),
        keepAvatar: z.boolean().optional(),
        keepBackground: z.boolean().optional(),
      },
    },
    async (args) =>
      textResult(
        await runAgentAction(auth, "apply_design_template", {
          ...args,
          handle:
            handleOptional(args.handle) ??
            (auth.scope === "page" ? auth.handle : ""),
        }),
      ),
  );

  server.registerTool(
    "set_avatar_image",
    {
      title: "프로필 이미지 설정",
      description: "https 이미지 URL로 아바타를 설정하거나 clear로 제거합니다.",
      inputSchema: {
        handle: defaultHandle,
        imageUrl: z.string().optional(),
        clear: z.boolean().optional(),
      },
    },
    async (args) =>
      textResult(
        await runAgentAction(auth, "set_avatar_image", {
          ...args,
          handle:
            handleOptional(args.handle) ??
            (auth.scope === "page" ? auth.handle : ""),
        }),
      ),
  );

  server.registerTool(
    "set_background_image",
    {
      title: "배경 이미지 설정",
      description: "https 배경 이미지와 스크림(어둡기)을 설정합니다.",
      inputSchema: {
        handle: defaultHandle,
        imageUrl: z.string().optional(),
        scrim: z.number().min(0).max(0.85).optional(),
        clear: z.boolean().optional(),
      },
    },
    async (args) =>
      textResult(
        await runAgentAction(auth, "set_background_image", {
          ...args,
          handle:
            handleOptional(args.handle) ??
            (auth.scope === "page" ? auth.handle : ""),
        }),
      ),
  );

  server.registerTool(
    "set_custom_css",
    {
      title: "커스텀 CSS 삽입",
      description:
        "프로필 디자인용 CSS 스니펫을 삽입합니다. @import/javascript는 차단됩니다.",
      inputSchema: {
        handle: defaultHandle,
        css: z.string().optional(),
        clear: z.boolean().optional(),
      },
    },
    async (args) =>
      textResult(
        await runAgentAction(auth, "set_custom_css", {
          ...args,
          handle:
            handleOptional(args.handle) ??
            (auth.scope === "page" ? auth.handle : ""),
        }),
      ),
  );

  server.registerTool(
    "update_design",
    {
      title: "디자인 세부 수정",
      description:
        "layout/버튼/CTA(featuredFill)/tokens/sections/proofItems/logo/headline 등 디자인 필드를 수정합니다. buttonFill은 일반 카드만, featuredFill은 CTA만 적용됩니다.",
      inputSchema: {
        handle: defaultHandle,
        theme: z.string().optional(),
        accent: z.string().optional(),
        layout: z.enum(["stack", "bento", "list"]).optional(),
        pattern: z.string().optional(),
        motion: z.string().optional(),
        effect: z.string().optional(),
        card: z.string().optional(),
        buttonStyle: z.string().optional(),
        buttonShadow: z.string().optional(),
        buttonFill: z.string().optional(),
        buttonText: z.string().optional(),
        featuredFill: z.string().optional(),
        featuredText: z.string().optional(),
        featuredBorder: z.string().optional(),
        size: z.string().optional(),
        radius: z.string().optional(),
        font: z.string().optional(),
        effectCard: z.string().optional(),
        scrim: z.number().optional(),
        templateId: z.string().optional(),
        showHandle: z.boolean().optional(),
        showAvatar: z.boolean().optional(),
        sections: z
          .array(
            z.object({
              id: z.string(),
              title: z.string().optional(),
              columns: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
              mobileColumns: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
              layout: z.enum(["full", "grid", "stack"]).optional(),
              order: z.number().optional(),
              items: z.array(z.string()).optional(),
              gap: z.number().min(0).max(48).optional(),
              sectionGap: z.number().min(0).max(48).optional().describe("gap 별칭"),
              rowGap: z.number().min(0).max(48).optional(),
              columnGap: z.number().min(0).max(48).optional(),
              mobileGap: z.number().min(0).max(48).optional(),
            }),
          )
          .optional()
          .describe("섹션 배열 — columns/items/gap"),
        proofItems: z
          .array(
            z.object({
              value: z.string(),
              label: z.string(),
            }),
          )
          .nullable()
          .optional()
          .describe("헤더 통계 바. null이면 제거"),
        tokens: z
          .object({
            pageBackground: z.string().optional(),
            cardBackground: z.string().optional(),
            cardText: z.string().optional(),
            mutedText: z.string().optional(),
            featuredBackground: z.string().optional(),
            featuredText: z.string().optional(),
            borderColor: z.string().optional(),
          })
          .optional()
          .describe("페이지/카드 색 토큰"),
        logoUrl: z
          .string()
          .nullable()
          .optional()
          .describe("브랜드 로고 https URL. null이면 제거"),
        brandLogoUrl: z.string().nullable().optional().describe("logoUrl 별칭"),
        logoImageUrl: z.string().nullable().optional().describe("logoUrl 별칭"),
        logoWidth: z.number().min(24).max(480).optional(),
        logoHeight: z.number().min(16).max(240).optional(),
        logoAlign: z.enum(["center", "left", "right"]).optional(),
        contentMaxWidth: z
          .number()
          .min(320)
          .max(960)
          .optional()
          .describe("콘텐츠 폭 px. 예: 765"),
        headline: z.string().nullable().optional(),
        headlineHighlight: z
          .string()
          .nullable()
          .optional()
          .describe("headline 안에서 accent로 강조할 부분 문자열"),
        headlineSegments: z
          .array(
            z.object({
              text: z.string(),
              accent: z.boolean().optional(),
              breakAfter: z.boolean().optional(),
            }),
          )
          .nullable()
          .optional()
          .describe("헤드라인 세그먼트(줄바꿈/강조)"),
        headerAlign: z.enum(["center", "left"]).optional(),
        heroGraphic: z.enum(["none", "golf"]).optional(),
        heroGraphicUrl: z.string().nullable().optional(),
        heroImageUrl: z
          .string()
          .nullable()
          .optional()
          .describe("heroGraphicUrl 별칭"),
        heroGraphicSize: z.number().min(24).max(240).optional(),
        heroGraphicPosition: z
          .enum(["right", "left", "below", "above"])
          .optional(),
        desktopFontSize: z
          .number()
          .min(12)
          .max(28)
          .optional()
          .describe("카드/본문 기본 글자 px (데스크톱)"),
        mobileFontSize: z.number().min(11).max(24).optional(),
        lineHeight: z.number().min(1).max(2.2).optional(),
        letterSpacing: z
          .string()
          .nullable()
          .optional()
          .describe("예: -0.02em"),
        headlineFontSize: z.number().min(14).max(48).optional(),
        headlineMobileFontSize: z.number().min(14).max(36).optional(),
      },
    },
    async (args) =>
      textResult(
        await runAgentAction(auth, "update_design", {
          ...args,
          handle:
            handleOptional(args.handle) ??
            (auth.scope === "page" ? auth.handle : ""),
        }),
      ),
  );

  server.registerTool(
    "upsert_section",
    {
      title: "섹션 추가/수정",
      description:
        "‘핵심 서비스’/‘바로가기’ 등 섹션 레이아웃을 설정합니다. items에는 linkId 또는 groupId(section)를 넣습니다.",
      inputSchema: {
        handle: defaultHandle,
        id: z.string(),
        title: z.string().optional(),
        columns: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
        mobileColumns: z
          .union([z.literal(1), z.literal(2), z.literal(3)])
          .optional()
          .describe("모바일 컬럼 수"),
        layout: z.enum(["full", "grid", "stack"]).optional(),
        order: z.number().optional(),
        items: z.array(z.string()).optional(),
        gap: z.number().min(0).max(48).optional(),
        sectionGap: z
          .number()
          .min(0)
          .max(48)
          .optional()
          .describe("gap 별칭"),
        rowGap: z.number().min(0).max(48).optional(),
        columnGap: z.number().min(0).max(48).optional(),
        mobileGap: z.number().min(0).max(48).optional(),
        clear: z.boolean().optional().describe("true면 모든 섹션 제거"),
      },
    },
    async (args) =>
      textResult(
        await runAgentAction(auth, "upsert_section", {
          ...args,
          handle:
            handleOptional(args.handle) ??
            (auth.scope === "page" ? auth.handle : ""),
        }),
      ),
  );

  server.registerTool(
    "upload_asset",
    {
      title: "이미지 업로드",
      description:
        "dataUri/file/base64 이미지를 업로드하고 { url, httpsUrl, width, height, mimeType }을 반환합니다. logoImageUrl·iconImageUrl·heroImageUrl·leadingIconUrl에 사용하세요.",
      inputSchema: {
        handle: defaultHandle,
        dataUri: z
          .string()
          .optional()
          .describe("data:image/png;base64,..."),
        file: z.string().optional().describe("dataUri 별칭"),
        base64: z.string().optional().describe("순수 base64 (mimeType 필요)"),
        mimeType: z.string().optional().describe("base64일 때 image/png 등"),
        purpose: z
          .enum(["logo", "icon", "hero", "general"])
          .optional()
          .describe("용도 태그"),
      },
    },
    async (args) =>
      textResult(
        await runAgentAction(auth, "upload_asset", {
          ...args,
          handle:
            handleOptional(args.handle) ??
            (auth.scope === "page" ? auth.handle : ""),
        }),
      ),
  );

  server.registerTool(
    "get_preview_url",
    {
      title: "미리보기 URL",
      description:
        "공개 페이지 URL을 반환합니다. MCP로 변경 후 이 URL을 새로고침해 확인하세요.",
      inputSchema: {
        handle: defaultHandle,
        baseUrl: z
          .string()
          .optional()
          .describe("기본값: 사이트 오리진. 예: https://bio.omo.co.kr"),
      },
    },
    async (args) =>
      textResult(
        await runAgentAction(auth, "get_preview_url", {
          ...args,
          handle: resolveHandle(auth, args.handle),
        }),
      ),
  );

  server.registerTool(
    "open_profile_designer",
    {
      title: "프로필 디자이너 열기",
      description:
        "ChatGPT/MCP Apps 대화창에 Bioomo 제작 위젯을 엽니다. 템플릿 선택·콘텐츠·디자인·미리보기·게시. CSS 직접 작성 금지 — Page Schema만 사용.",
      inputSchema: {
        handle: defaultHandle,
        step: z
          .enum(["guide", "template", "content", "design", "preview"])
          .optional()
          .describe("시작 단계"),
      },
      _meta: {
        ui: { resourceUri: PROFILE_DESIGNER_URI },
        "openai/outputTemplate": PROFILE_DESIGNER_URI,
        "openai/toolInvocation/invoking": "프로필 디자이너 여는 중…",
        "openai/toolInvocation/invoked": "프로필 디자이너를 표시했습니다.",
        "openai/widgetAccessible": true,
      },
    },
    async (args) =>
      textResult(
        await runAgentAction(auth, "open_profile_designer", {
          handle: resolveHandle(auth, args.handle),
          step: args.step,
        }),
      ),
  );

  server.registerTool(
    "list_templates",
    {
      title: "스키마 템플릿 목록",
      description:
        "버전 관리되는 Page Schema 템플릿(FMGS Premium, Corporate Grid 등)을 나열합니다.",
    },
    async () => textResult(await runAgentAction(auth, "list_templates", {})),
  );

  server.registerTool(
    "get_template",
    {
      title: "템플릿 상세",
      description: "템플릿 스키마·반응형 규칙·검증 결과를 반환합니다.",
      inputSchema: {
        templateId: z.string().describe("예: fmgs-premium"),
      },
    },
    async (args) =>
      textResult(await runAgentAction(auth, "get_template", args)),
  );

  server.registerTool(
    "create_page_from_template",
    {
      title: "템플릿으로 페이지 생성",
      description:
        "템플릿을 복제해 Page Schema로 적용합니다. persist 기본 true. publish:true면 즉시 게시.",
      inputSchema: {
        handle: defaultHandle,
        templateId: z.string(),
        displayName: z.string().optional(),
        headline: z.string().optional(),
        theme: z.string().optional(),
        logoUrl: z.string().optional(),
        persist: z.boolean().optional(),
        publish: z.boolean().optional(),
      },
    },
    async (args) =>
      textResult(
        await runAgentAction(auth, "create_page_from_template", {
          ...args,
          handle: resolveHandle(auth, args.handle),
        }),
      ),
  );

  server.registerTool(
    "get_page_schema",
    {
      title: "페이지 스키마 조회",
      description: "draft/published Page Schema와 버전 목록을 조회합니다.",
      inputSchema: { handle: defaultHandle },
    },
    async (args) =>
      textResult(
        await runAgentAction(auth, "get_page_schema", {
          handle: resolveHandle(auth, args.handle),
        }),
      ),
  );

  server.registerTool(
    "update_page_content",
    {
      title: "페이지 스키마 업데이트",
      description:
        "구조화된 Page Schema(또는 schema 필드)로 콘텐츠/테마/섹션을 갱신합니다. CSS 금지.",
      inputSchema: {
        handle: defaultHandle,
        schema: z.record(z.string(), z.unknown()).optional(),
        templateId: z.string().optional(),
        theme: z.string().optional(),
        contentWidth: z.union([z.string(), z.number()]).optional(),
        brand: z.record(z.string(), z.unknown()).optional(),
        sections: z.array(z.unknown()).optional(),
        designOptions: z.record(z.string(), z.unknown()).optional(),
        publish: z.boolean().optional(),
      },
    },
    async (args) =>
      textResult(
        await runAgentAction(auth, "update_page_content", {
          ...args,
          handle: resolveHandle(auth, args.handle),
        }),
      ),
  );

  server.registerTool(
    "update_section",
    {
      title: "섹션 수정",
      description: "sectionId(또는 type)로 섹션 필드를 패치합니다.",
      inputSchema: {
        handle: defaultHandle,
        sectionId: z.string(),
        patch: z.record(z.string(), z.unknown()).optional(),
      },
    },
    async (args) =>
      textResult(
        await runAgentAction(auth, "update_section", {
          ...args,
          handle: resolveHandle(auth, args.handle),
        }),
      ),
  );

  server.registerTool(
    "upsert_component",
    {
      title: "컴포넌트 추가/수정",
      description: "serviceGrid/shortcuts/social 아이템을 upsert합니다.",
      inputSchema: {
        handle: defaultHandle,
        sectionId: z.string(),
        componentId: z.string().optional(),
        component: z.record(z.string(), z.unknown()),
      },
    },
    async (args) =>
      textResult(
        await runAgentAction(auth, "upsert_component", {
          ...args,
          handle: resolveHandle(auth, args.handle),
        }),
      ),
  );

  server.registerTool(
    "reorder_components",
    {
      title: "컴포넌트 순서 변경",
      description: "섹션 내 아이템 순서를 orderedIds로 재배치합니다.",
      inputSchema: {
        handle: defaultHandle,
        sectionId: z.string(),
        orderedIds: z.array(z.string()),
      },
    },
    async (args) =>
      textResult(
        await runAgentAction(auth, "reorder_components", {
          ...args,
          handle: resolveHandle(auth, args.handle),
        }),
      ),
  );

  server.registerTool(
    "render_preview",
    {
      title: "미리보기 렌더 정보",
      description:
        "동일 React 렌더러 기준 preview/designer/public URL과 검증 결과를 반환합니다.",
      inputSchema: {
        handle: defaultHandle,
        baseUrl: z.string().optional(),
      },
    },
    async (args) =>
      textResult(
        await runAgentAction(auth, "render_preview", {
          ...args,
          handle: resolveHandle(auth, args.handle),
        }),
      ),
  );

  server.registerTool(
    "validate_page",
    {
      title: "페이지 검증",
      description:
        "모바일 깨짐·URL 누락·그리드 규칙 등 Page Schema 검증을 수행합니다.",
      inputSchema: {
        handle: defaultHandle,
        schema: z.record(z.string(), z.unknown()).optional(),
      },
    },
    async (args) =>
      textResult(
        await runAgentAction(auth, "validate_page", {
          ...args,
          handle: resolveHandle(auth, args.handle),
        }),
      ),
  );

  server.registerTool(
    "save_draft",
    {
      title: "초안 저장",
      description: "Page Schema 초안을 버전으로 저장하고 디자인/링크를 동기화합니다.",
      inputSchema: {
        handle: defaultHandle,
        schema: z.record(z.string(), z.unknown()).optional(),
        label: z.string().optional(),
      },
    },
    async (args) =>
      textResult(
        await runAgentAction(auth, "save_draft", {
          ...args,
          handle: resolveHandle(auth, args.handle),
        }),
      ),
  );

  server.registerTool(
    "publish_page",
    {
      title: "페이지 게시",
      description:
        "검증 후 Page Schema를 게시합니다. 오류 시 force:true로 강제 가능.",
      inputSchema: {
        handle: defaultHandle,
        schema: z.record(z.string(), z.unknown()).optional(),
        label: z.string().optional(),
        force: z.boolean().optional(),
      },
    },
    async (args) =>
      textResult(
        await runAgentAction(auth, "publish_page", {
          ...args,
          handle: resolveHandle(auth, args.handle),
        }),
      ),
  );

  server.registerTool(
    "restore_version",
    {
      title: "버전 복원",
      description: "schemaVersions의 versionId로 이전 Page Schema를 복원·게시합니다.",
      inputSchema: {
        handle: defaultHandle,
        versionId: z.string(),
      },
    },
    async (args) =>
      textResult(
        await runAgentAction(auth, "restore_version", {
          ...args,
          handle: resolveHandle(auth, args.handle),
        }),
      ),
  );

  server.registerPrompt(
    "profile_creation_helper",
    {
      title: "프로필생성도우미",
      description:
        "MCP 연결 후 질의응답으로 OMO Bio 프로필을 완성하도록 안내하는 프롬프트입니다.",
      argsSchema: {
        handle: z
          .string()
          .optional()
          .describe(
            auth.scope === "page"
              ? `기본 handle: ${auth.handle}`
              : "대상 페이지 handle",
          ),
      },
    },
    async ({ handle }) => {
      const target =
        handleOptional(handle) ??
        (auth.scope === "page" ? auth.handle : "(handle 필요)");
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: [
                `OMO Bio 프로필생성도우미를 실행하세요. handle=${target}`,
                "1) open_profile_designer 호출 (가능하면 ChatGPT 위젯으로 진행)",
                "2) 또는 start_profile_wizard → answer_profile_wizard 반복",
                "3) list_templates → create_page_from_template(templateId)",
                "4) update_page_content / upload_asset 으로 문구·로고·링크 채우기",
                "5) validate_page → publish_page",
                "중요: set_custom_css 사용 금지. MCP URL은 https://bio.omo.co.kr 만.",
                "한국어로 친절하게 진행하세요.",
              ].join("\n"),
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    "design_editor",
    {
      title: "디자인 편집 가이드",
      description:
        "공개 페이지 디자인을 MCP 도구만으로 수정할 때 따르는 워크플로/필드 가이드입니다. 콘텐츠는 사용자 요청 범위만 변경하세요.",
      argsSchema: {
        handle: z
          .string()
          .optional()
          .describe(
            auth.scope === "page"
              ? `기본 handle: ${auth.handle}`
              : "대상 페이지 handle",
          ),
      },
    },
    async ({ handle }) => {
      const target =
        handleOptional(handle) ??
        (auth.scope === "page" ? auth.handle : "(handle 필요)");
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: [
                `OMO Bio 디자인을 MCP로 편집합니다. handle=${target}`,
                "권장: open_profile_designer → list_templates → create_page_from_template → update_page_content/update_section → validate_page → publish_page",
                "중요: CSS(set_custom_css)를 직접 쓰지 마세요. Page Schema + 디자인 토큰만 사용합니다.",
                "",
                "레거시 워크플로(스키마 없을 때만):",
                "1) list_design_capabilities",
                "2) get_page",
                "3) upload_asset → logo/icon/hero URL",
                "4) update_design / upsert_section / upsert_link",
                "5) get_preview_url / render_preview",
                "",
                "한국어로 진행하고, 변경에 쓴 도구를 짧게 보고하세요.",
              ].join("\n"),
            },
          },
        ],
      };
    },
  );

  return server;
}
