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
    version: "0.2.0",
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
      description: "링크 버튼을 만들거나 수정합니다.",
      inputSchema: {
        handle: defaultHandle,
        linkId: z.string().optional(),
        label: z.string(),
        sublabel: z.string().optional(),
        url: z.string(),
        featured: z.boolean().optional(),
        isVisible: z.boolean().optional(),
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
        "layout/pattern/motion/effect/card/size/radius/font 등 디자인 필드를 수정합니다.",
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
        size: z.string().optional(),
        radius: z.string().optional(),
        font: z.string().optional(),
        effectCard: z.string().optional(),
        scrim: z.number().optional(),
        templateId: z.string().optional(),
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

  return server;
}
