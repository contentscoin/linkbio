#!/usr/bin/env node
/**
 * OMO Bio MCP server (stdio) — proxies to /api/v1/agent
 *
 * Env:
 *   LINKBIO_BASE_URL  e.g. https://bio.omo.co.kr
 *   MCP_API_KEY       personal page token (lbmcp_…) or global MCP_API_KEY
 *
 * Keep tool schemas in sync with src/lib/mcp-server.ts (HTTP MCP).
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const baseUrl = (process.env.LINKBIO_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);
const apiKey = process.env.MCP_API_KEY || "";

async function agentFetch(method, query, body) {
  const url = new URL(`${baseUrl}/api/v1/agent`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value != null) url.searchParams.set(key, String(value));
    }
  }
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json();
  if (!response.ok || json.ok === false) {
    throw new Error(json.error || `HTTP ${response.status}`);
  }
  return json;
}

const handleProp = { type: "string", description: "페이지 handle" };

const tools = [
  {
    name: "get_page",
    description:
      "프로필·링크·디자인·layoutDebug·previewUrl을 조회합니다. 저장 span vs 계산 span 확인용.",
    inputSchema: {
      type: "object",
      properties: { handle: handleProp },
      required: ["handle"],
      additionalProperties: true,
    },
  },
  {
    name: "update_profile",
    description: "displayName, bio, theme, accent, 공개 여부를 수정합니다.",
    inputSchema: {
      type: "object",
      properties: {
        handle: handleProp,
        displayName: { type: "string" },
        bio: { type: "string" },
        theme: { type: "string" },
        accent: { type: "string" },
        isPublished: { type: "boolean" },
      },
      required: ["handle"],
      additionalProperties: true,
    },
  },
  {
    name: "upsert_link",
    description:
      "링크 생성/부분 수정. linkId만으로 span·iconImageUrl·subtitlePlacement·arrowStyle·cardHeight 등 패치 가능. 신규 시 label+url 필수.",
    inputSchema: {
      type: "object",
      properties: {
        handle: handleProp,
        linkId: { type: "string", description: "있으면 부분 수정" },
        label: { type: "string" },
        sublabel: { type: "string" },
        url: { type: "string" },
        featured: { type: "boolean" },
        isVisible: { type: "boolean" },
        sortOrder: { type: "number" },
        span: { type: "number", description: "그리드 가로 점유 1|2|3" },
        colSpan: { type: "number", description: "span 별칭" },
        mobileSpan: { type: "number" },
        rowSpan: { type: "number" },
        variant: { type: "string", description: "card|full|spotlight" },
        layout: { type: "string", description: "horizontal|vertical" },
        cardLayout: { type: "string" },
        section: { type: "string", description: "섹션/그룹 id" },
        groupId: { type: "string", description: "section 별칭" },
        iconKey: { type: "string" },
        iconUrl: { type: "string" },
        iconImageUrl: { type: "string", description: "이미지 아이콘 https" },
        iconSize: { type: "number" },
        iconPlacement: { type: "string", description: "leading|top|trailing" },
        leadingIconUrl: { type: "string" },
        leadingIcon: { type: "string" },
        secondaryText: { type: "string" },
        trailingText: { type: "string" },
        subtitlePlacement: {
          type: "string",
          description: "body|trailing",
        },
        badge: { type: "string" },
        showArrow: { type: "boolean" },
        arrowStyle: { type: "string", description: "plain|circle" },
        arrowPosition: { type: "string", description: "trailing|top-right|end" },
        showDivider: { type: "boolean" },
        trailingIcon: { type: "string" },
        cardPadding: { type: "string" },
        padding: { type: "string" },
        cardMinHeight: { type: "number" },
        minHeight: { type: "number" },
        cardHeight: { type: "number" },
        height: { type: "number" },
        aspectRatio: { type: "string" },
        objectFit: { type: "string", description: "contain|cover" },
        imageSize: { type: "number" },
        imagePosition: { type: "string", description: "top|leading|trailing" },
        mobileCardMinHeight: { type: "number" },
        mobileCardHeight: { type: "number" },
        mobileCardPadding: { type: "string" },
      },
      required: ["handle"],
      additionalProperties: true,
    },
  },
  {
    name: "delete_link",
    description: "linkId로 링크를 삭제합니다.",
    inputSchema: {
      type: "object",
      properties: { handle: handleProp, linkId: { type: "string" } },
      required: ["handle", "linkId"],
      additionalProperties: true,
    },
  },
  {
    name: "list_design_capabilities",
    description:
      "편집 가능 design/link 필드·upload_asset·레이아웃 레시피·data-role 목록을 반환합니다.",
    inputSchema: { type: "object", properties: {}, additionalProperties: true },
  },
  {
    name: "start_profile_wizard",
    description: "프로필생성도우미를 시작합니다.",
    inputSchema: {
      type: "object",
      properties: { handle: handleProp },
      required: ["handle"],
      additionalProperties: true,
    },
  },
  {
    name: "answer_profile_wizard",
    description: "위저드 단계 답변을 제출합니다.",
    inputSchema: {
      type: "object",
      properties: {
        handle: handleProp,
        answer: { type: "string" },
        stepId: { type: "string" },
      },
      required: ["handle", "answer"],
      additionalProperties: true,
    },
  },
  {
    name: "get_profile_wizard_status",
    description: "위저드 진행 상태를 조회합니다.",
    inputSchema: {
      type: "object",
      properties: { handle: handleProp },
      required: ["handle"],
      additionalProperties: true,
    },
  },
  {
    name: "list_design_templates",
    description: "디자인 템플릿 목록을 반환합니다.",
    inputSchema: { type: "object", properties: {}, additionalProperties: true },
  },
  {
    name: "apply_design_template",
    description: "템플릿을 페이지에 적용합니다.",
    inputSchema: {
      type: "object",
      properties: {
        handle: handleProp,
        templateId: { type: "string" },
        accent: { type: "string" },
        keepAvatar: { type: "boolean" },
        keepBackground: { type: "boolean" },
      },
      required: ["handle", "templateId"],
      additionalProperties: true,
    },
  },
  {
    name: "set_avatar_image",
    description: "아바타 이미지 https URL을 설정/제거합니다.",
    inputSchema: {
      type: "object",
      properties: {
        handle: handleProp,
        imageUrl: { type: "string" },
        clear: { type: "boolean" },
      },
      required: ["handle"],
      additionalProperties: true,
    },
  },
  {
    name: "set_background_image",
    description: "배경 이미지와 scrim을 설정/제거합니다.",
    inputSchema: {
      type: "object",
      properties: {
        handle: handleProp,
        imageUrl: { type: "string" },
        scrim: { type: "number" },
        clear: { type: "boolean" },
      },
      required: ["handle"],
      additionalProperties: true,
    },
  },
  {
    name: "set_custom_css",
    description:
      "커스텀 CSS 설정. 8000자 초과 시 오류(절단 없음). [data-role=page-root] 기준.",
    inputSchema: {
      type: "object",
      properties: {
        handle: handleProp,
        css: { type: "string" },
        clear: { type: "boolean" },
      },
      required: ["handle"],
      additionalProperties: true,
    },
  },
  {
    name: "update_design",
    description:
      "디자인 수정: tokens, sections, proofItems, logoImageUrl, heroImageUrl, headline, contentMaxWidth, featuredFill/Text, typography(desktopFontSize/mobileFontSize/lineHeight/letterSpacing) 등.",
    inputSchema: {
      type: "object",
      properties: {
        handle: handleProp,
        theme: { type: "string" },
        accent: { type: "string" },
        layout: { type: "string", description: "stack|bento|list" },
        pattern: { type: "string" },
        motion: { type: "string" },
        effect: { type: "string" },
        card: { type: "string" },
        buttonStyle: { type: "string" },
        buttonShadow: { type: "string" },
        buttonFill: { type: "string" },
        buttonText: { type: "string" },
        featuredFill: { type: "string", description: "CTA 배경만" },
        featuredText: { type: "string", description: "CTA 글자색" },
        featuredBorder: { type: "string" },
        size: { type: "string" },
        radius: { type: "string" },
        font: { type: "string" },
        effectCard: { type: "string" },
        scrim: { type: "number" },
        templateId: { type: "string" },
        showHandle: { type: "boolean" },
        showAvatar: { type: "boolean" },
        tokens: {
          type: "object",
          description: "페이지/카드 색 토큰",
          additionalProperties: true,
        },
        sections: {
          type: "array",
          description: "섹션 배열 (columns/gap/items)",
          items: { type: "object", additionalProperties: true },
        },
        proofItems: {
          type: "array",
          description: "헤더 통계 바 [{value,label}]. null 제거",
          items: {
            type: "object",
            properties: {
              value: { type: "string" },
              label: { type: "string" },
            },
          },
        },
        logoUrl: { type: "string" },
        brandLogoUrl: { type: "string" },
        logoImageUrl: { type: "string", description: "워드마크 https" },
        logoWidth: { type: "number" },
        logoHeight: { type: "number" },
        logoAlign: { type: "string" },
        contentMaxWidth: { type: "number", description: "예: 765" },
        headline: { type: "string" },
        headlineHighlight: { type: "string" },
        headlineSegments: {
          type: "array",
          items: { type: "object", additionalProperties: true },
        },
        headerAlign: { type: "string" },
        heroGraphic: { type: "string", description: "none|golf" },
        heroGraphicUrl: { type: "string" },
        heroImageUrl: { type: "string", description: "heroGraphicUrl 별칭" },
        heroGraphicSize: { type: "number" },
        heroGraphicPosition: { type: "string" },
        desktopFontSize: { type: "number", description: "본문/카드 기본 px" },
        mobileFontSize: { type: "number" },
        lineHeight: { type: "number" },
        letterSpacing: { type: "string", description: "예: -0.02em" },
        headlineFontSize: { type: "number" },
        headlineMobileFontSize: { type: "number" },
      },
      required: ["handle"],
      additionalProperties: true,
    },
  },
  {
    name: "upsert_section",
    description:
      "섹션 레이아웃: title, columns, mobileColumns, items, gap|sectionGap, rowGap, columnGap, mobileGap.",
    inputSchema: {
      type: "object",
      properties: {
        handle: handleProp,
        id: { type: "string" },
        title: { type: "string" },
        columns: { type: "number" },
        mobileColumns: { type: "number" },
        layout: { type: "string" },
        order: { type: "number" },
        items: { type: "array", items: { type: "string" } },
        gap: { type: "number" },
        sectionGap: { type: "number", description: "gap 별칭" },
        rowGap: { type: "number" },
        columnGap: { type: "number" },
        mobileGap: { type: "number" },
        clear: { type: "boolean" },
      },
      required: ["handle"],
      additionalProperties: true,
    },
  },
  {
    name: "upload_asset",
    description:
      "이미지 업로드. file|dataUri|base64 → { url, httpsUrl, width, height, mimeType }. 결과를 logoImageUrl/iconImageUrl/heroImageUrl/leadingIconUrl에 넣으세요.",
    inputSchema: {
      type: "object",
      properties: {
        handle: handleProp,
        dataUri: {
          type: "string",
          description: "data:image/png;base64,...",
        },
        file: { type: "string", description: "dataUri 별칭" },
        base64: { type: "string" },
        mimeType: { type: "string" },
        purpose: {
          type: "string",
          description: "logo|icon|hero|general",
        },
      },
      required: ["handle"],
      additionalProperties: true,
    },
  },
  {
    name: "get_preview_url",
    description: "공개 미리보기 URL(previewUrl/publicUrl)을 반환합니다.",
    inputSchema: {
      type: "object",
      properties: {
        handle: handleProp,
        baseUrl: { type: "string", description: "기본: 사이트 오리진" },
      },
      required: ["handle"],
      additionalProperties: true,
    },
  },
  {
    name: "open_profile_designer",
    description:
      "ChatGPT/MCP Apps에 Bioomo 프로필 디자이너 위젯을 엽니다. CSS 금지 — Page Schema만.",
    inputSchema: {
      type: "object",
      properties: {
        handle: handleProp,
        step: {
          type: "string",
          description: "guide|template|content|design|preview",
        },
      },
      required: ["handle"],
      additionalProperties: true,
    },
  },
  {
    name: "list_templates",
    description: "버전 관리 Page Schema 템플릿 목록(FMGS Premium 등).",
    inputSchema: { type: "object", properties: {}, additionalProperties: true },
  },
  {
    name: "get_template",
    description: "템플릿 스키마·반응형 규칙·검증 결과.",
    inputSchema: {
      type: "object",
      properties: { templateId: { type: "string" } },
      required: ["templateId"],
      additionalProperties: true,
    },
  },
  {
    name: "create_page_from_template",
    description: "템플릿으로 Page Schema 적용. persist 기본 true.",
    inputSchema: {
      type: "object",
      properties: {
        handle: handleProp,
        templateId: { type: "string" },
        displayName: { type: "string" },
        headline: { type: "string" },
        theme: { type: "string" },
        logoUrl: { type: "string" },
        persist: { type: "boolean" },
        publish: { type: "boolean" },
      },
      required: ["handle", "templateId"],
      additionalProperties: true,
    },
  },
  {
    name: "get_page_schema",
    description: "draft/published Page Schema와 버전 목록.",
    inputSchema: {
      type: "object",
      properties: { handle: handleProp },
      required: ["handle"],
      additionalProperties: true,
    },
  },
  {
    name: "update_page_content",
    description: "구조화 Page Schema로 콘텐츠/테마/섹션 갱신. CSS 금지.",
    inputSchema: {
      type: "object",
      properties: {
        handle: handleProp,
        schema: { type: "object", additionalProperties: true },
        templateId: { type: "string" },
        theme: { type: "string" },
        contentWidth: {},
        brand: { type: "object", additionalProperties: true },
        sections: { type: "array" },
        designOptions: { type: "object", additionalProperties: true },
        canvas: {
          type: "object",
          additionalProperties: true,
          description: "아트보드 힌트 { width, height } — fmgs-exact: 853×1844",
        },
        footer: {
          type: "object",
          additionalProperties: true,
          description: "{ label?, url?, style?: fmgs|omo|none }",
        },
        publish: { type: "boolean" },
      },
      required: ["handle"],
      additionalProperties: true,
    },
  },
  {
    name: "update_section",
    description: "sectionId로 섹션 패치.",
    inputSchema: {
      type: "object",
      properties: {
        handle: handleProp,
        sectionId: { type: "string" },
        patch: { type: "object", additionalProperties: true },
      },
      required: ["handle", "sectionId"],
      additionalProperties: true,
    },
  },
  {
    name: "upsert_component",
    description: "serviceGrid/shortcuts/social 아이템 upsert.",
    inputSchema: {
      type: "object",
      properties: {
        handle: handleProp,
        sectionId: { type: "string" },
        componentId: { type: "string" },
        component: { type: "object", additionalProperties: true },
      },
      required: ["handle", "sectionId", "component"],
      additionalProperties: true,
    },
  },
  {
    name: "reorder_components",
    description: "섹션 아이템 순서 변경.",
    inputSchema: {
      type: "object",
      properties: {
        handle: handleProp,
        sectionId: { type: "string" },
        orderedIds: { type: "array", items: { type: "string" } },
      },
      required: ["handle", "sectionId", "orderedIds"],
      additionalProperties: true,
    },
  },
  {
    name: "render_preview",
    description: "동일 렌더러 기준 preview/designer/public URL + 검증.",
    inputSchema: {
      type: "object",
      properties: {
        handle: handleProp,
        baseUrl: { type: "string" },
      },
      required: ["handle"],
      additionalProperties: true,
    },
  },
  {
    name: "validate_page",
    description: "Page Schema 모바일/URL/그리드 검증.",
    inputSchema: {
      type: "object",
      properties: {
        handle: handleProp,
        schema: { type: "object", additionalProperties: true },
      },
      required: ["handle"],
      additionalProperties: true,
    },
  },
  {
    name: "save_draft",
    description: "Page Schema 초안 버전 저장 + 링크 동기화.",
    inputSchema: {
      type: "object",
      properties: {
        handle: handleProp,
        schema: { type: "object", additionalProperties: true },
        label: { type: "string" },
      },
      required: ["handle"],
      additionalProperties: true,
    },
  },
  {
    name: "publish_page",
    description: "검증 후 Page Schema 게시. force로 강제 가능.",
    inputSchema: {
      type: "object",
      properties: {
        handle: handleProp,
        schema: { type: "object", additionalProperties: true },
        label: { type: "string" },
        force: { type: "boolean" },
      },
      required: ["handle"],
      additionalProperties: true,
    },
  },
  {
    name: "restore_version",
    description: "versionId로 이전 Page Schema 복원·게시.",
    inputSchema: {
      type: "object",
      properties: {
        handle: handleProp,
        versionId: { type: "string" },
      },
      required: ["handle", "versionId"],
      additionalProperties: true,
    },
  },
];

const postActions = new Set([
  "update_profile",
  "upsert_link",
  "delete_link",
  "list_design_capabilities",
  "start_profile_wizard",
  "answer_profile_wizard",
  "get_profile_wizard_status",
  "apply_design_template",
  "set_avatar_image",
  "set_background_image",
  "set_custom_css",
  "update_design",
  "upsert_section",
  "upload_asset",
  "get_preview_url",
  "open_profile_designer",
  "list_templates",
  "get_template",
  "create_page_from_template",
  "get_page_schema",
  "update_page_content",
  "update_section",
  "upsert_component",
  "reorder_components",
  "render_preview",
  "validate_page",
  "save_draft",
  "publish_page",
  "restore_version",
]);

const server = new Server(
  { name: "omo-bio", version: "0.8.3" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  let result;

  if (name === "get_page") {
    result = await agentFetch("GET", {
      action: "get_page",
      handle: args.handle,
    });
  } else if (name === "list_design_templates") {
    result = await agentFetch("GET", { action: "list_design_templates" });
  } else if (postActions.has(name)) {
    result = await agentFetch("POST", null, { action: name, ...args });
  } else {
    throw new Error(`Unknown tool: ${name}`);
  }

  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
