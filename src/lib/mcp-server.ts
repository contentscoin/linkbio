import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { McpAuthResult } from "@/lib/mcp-auth";
import { runAgentAction, type AgentResult } from "@/lib/agent-ops";

function textResult(result: AgentResult) {
  const isError = result.ok === false;
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
    isError,
  };
}

function handleOptional(value: string | undefined) {
  return value && value.trim() ? value : undefined;
}

/** Build a per-request MCP server bound to the authenticated scope. */
export function createOmoBioMcpServer(
  auth: Extract<McpAuthResult, { ok: true }>,
) {
  const server = new McpServer({
    name: "omo-bio",
    version: "0.3.0",
  });

  const defaultHandle =
    auth.scope === "page"
      ? z.string().optional().describe(`기본값: ${auth.handle}`)
      : z.string().describe("페이지 handle");

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
        "링크 버튼을 만들거나 수정합니다. linkId가 있으면 label/url 없이 변경 필드만 부분 수정(아이콘·배지·span·variant·featured 등). 신규 시 label+url 필수.",
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
        variant: z
          .string()
          .nullable()
          .optional()
          .describe("card|full|spotlight|featured"),
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
        badge: z
          .string()
          .nullable()
          .optional()
          .describe("카드 배지 텍스트, 예: 대표 서비스"),
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
          .optional(),
        sections: z
          .array(
            z.object({
              id: z.string(),
              title: z.string().optional(),
              columns: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
              layout: z.enum(["full", "grid", "stack"]).optional(),
              order: z.number().optional(),
              items: z.array(z.string()).optional(),
            }),
          )
          .optional(),
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
        logoUrl: z
          .string()
          .nullable()
          .optional()
          .describe("브랜드 로고 https URL. null이면 제거"),
        headline: z.string().nullable().optional(),
        headlineHighlight: z
          .string()
          .nullable()
          .optional()
          .describe("headline 안에서 accent로 강조할 부분 문자열"),
        headerAlign: z.enum(["center", "left"]).optional(),
        heroGraphic: z.enum(["none", "golf"]).optional(),
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
        layout: z.enum(["full", "grid", "stack"]).optional(),
        order: z.number().optional(),
        items: z.array(z.string()).optional(),
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
          handle:
            handleOptional(args.handle) ??
            (auth.scope === "page" ? auth.handle : ""),
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
                "1) start_profile_wizard 호출",
                "2) 반환된 instruction/question을 사용자에게 질문",
                "3) 답변을 answer_profile_wizard로 전달",
                "4) done=true 될 때까지 반복",
                "5) 필요하면 list_design_templates / apply_design_template / set_avatar_image / set_custom_css 로 디자인을 다듬기",
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
                "중요: 이미지를 '그대로 복제'하지 말고, 사용자가 요청한 필드만 도구로 수정하세요.",
                "",
                "워크플로:",
                "1) list_design_capabilities — 편집 가능 필드·아이콘·레시피 확인",
                "2) get_page — 현재 design/links/linkId 확인",
                "3) update_design — tokens, featuredFill, headline, proofItems, heroGraphic, showHandle/showAvatar 등",
                "4) upsert_section — 섹션 title/columns/items",
                "5) upsert_link — linkId + 변경 필드만 (예: { linkId, iconKey:'golf', badge:'대표 서비스', span:2 })",
                "6) get_preview_url — 공개 URL 안내 후 사용자 확인",
                "",
                "레이아웃 팁:",
                "- 2열 그리드 + 일부 전체폭: section columns:2 + 해당 링크 span:2",
                "- 라임 CTA: featuredFill/featuredText + 링크 featured:true + iconKey",
                "- 통계바: proofItems:[{value,label}]",
                "- 헤드라인 강조: headline + headlineHighlight",
                "- customCss는 네이티브 필드로 안 될 때만 사용",
                "",
                "한국어로 진행하고, 변경 전후 어떤 도구를 썼는지 짧게 보고하세요.",
              ].join("\n"),
            },
          },
        ],
      };
    },
  );

  return server;
}
