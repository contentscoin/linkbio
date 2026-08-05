import { getDesignTemplate, listDesignTemplates } from "@/lib/design-templates";
import type { PageDesign, WizardState } from "@/lib/page-design";
import { sanitizeHttpsUrl } from "@/lib/page-design";

export type WizardStepId =
  | "displayName"
  | "bio"
  | "template"
  | "accent"
  | "avatar"
  | "firstLink"
  | "publish";

export type WizardStep = {
  id: WizardStepId;
  question: string;
  hint: string;
  field: string;
  optional?: boolean;
  choices?: Array<{ value: string; label: string }>;
};

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: "displayName",
    question: "공개 페이지에 표시할 이름을 알려주세요.",
    hint: "예: 김오모 / OMO Studio",
    field: "displayName",
  },
  {
    id: "bio",
    question: "한 줄 소개를 적어주세요.",
    hint: "최대 280자. 예: 골프와 콘텐츠를 만듭니다.",
    field: "bio",
  },
  {
    id: "template",
    question: "디자인 템플릿을 골라주세요.",
    hint: "list_design_templates로 목록을 볼 수 있습니다.",
    field: "templateId",
    choices: listDesignTemplates().map((t) => ({
      value: t.id,
      label: `${t.name} — ${t.description}`,
    })),
  },
  {
    id: "accent",
    question: "포인트 컬러(accent)를 알려주세요.",
    hint: "CSS 색상. 예: #2d6a4f / teal / #e8c547. 비우면 템플릿 기본색.",
    field: "accent",
    optional: true,
  },
  {
    id: "avatar",
    question: "프로필 이미지 URL이 있나요? (https만)",
    hint: "없으면 이니셜을 씁니다. 예: https://cdn.example.com/me.jpg",
    field: "avatarImageUrl",
    optional: true,
  },
  {
    id: "firstLink",
    question: "첫 링크를 추가할까요? `라벨 | URL` 형식으로 답하세요.",
    hint: "예: 유튜브 | https://youtube.com/@omo  / 건너뛰려면 skip",
    field: "firstLink",
    optional: true,
  },
  {
    id: "publish",
    question: "페이지를 공개할까요?",
    hint: "yes / no (기본 yes)",
    field: "publish",
    choices: [
      { value: "yes", label: "공개" },
      { value: "no", label: "비공개로 두기" },
    ],
  },
];

export function getWizardStep(stepId: string): WizardStep | null {
  return WIZARD_STEPS.find((s) => s.id === stepId) ?? null;
}

export function nextWizardStepId(stepId: string): WizardStepId | null {
  const idx = WIZARD_STEPS.findIndex((s) => s.id === stepId);
  if (idx < 0) return WIZARD_STEPS[0]?.id ?? null;
  return WIZARD_STEPS[idx + 1]?.id ?? null;
}

export function startWizardState(): WizardState {
  return {
    active: true,
    stepId: WIZARD_STEPS[0]!.id,
    answers: {},
  };
}

export type WizardAnswerResult =
  | {
      ok: true;
      done: false;
      step: WizardStep;
      progress: { current: number; total: number };
      applied: Record<string, unknown>;
      instruction: string;
    }
  | {
      ok: true;
      done: true;
      applied: Record<string, unknown>;
      summary: string;
      instruction: string;
    }
  | { ok: false; error: string };

export function parseFirstLinkAnswer(answer: string) {
  const trimmed = answer.trim();
  if (!trimmed || /^skip|없음|없어요|다음에$/i.test(trimmed)) {
    return { skip: true as const };
  }
  const parts = trimmed.split("|").map((p) => p.trim());
  if (parts.length < 2) {
    return {
      skip: false as const,
      error: "형식이 올바르지 않습니다. `라벨 | https://...` 로 답해주세요.",
    };
  }
  const label = parts[0]!.slice(0, 80);
  const url = parts.slice(1).join("|").trim();
  if (!label) return { skip: false as const, error: "라벨이 비어 있습니다." };
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { skip: false as const, error: "http(s) URL만 허용됩니다." };
    }
    return { skip: false as const, label, url: parsed.toString() };
  } catch {
    return { skip: false as const, error: "올바른 URL이 아닙니다." };
  }
}

export function normalizeWizardAnswer(
  step: WizardStep,
  rawAnswer: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const answer = rawAnswer.trim();
  if (!answer) {
    if (step.optional) return { ok: true, value: "" };
    return { ok: false, error: "답변이 비어 있습니다." };
  }

  if (step.id === "displayName") {
    if (answer.length > 80) return { ok: false, error: "이름은 80자 이하여야 합니다." };
    return { ok: true, value: answer };
  }
  if (step.id === "bio") {
    return { ok: true, value: answer.slice(0, 280) };
  }
  if (step.id === "template") {
    const template = getDesignTemplate(answer.toLowerCase());
    if (!template) {
      const byName = listDesignTemplates().find(
        (t) => t.name === answer || t.id === answer,
      );
      if (!byName) {
        return {
          ok: false,
          error: `알 수 없는 템플릿입니다. 사용 가능: ${listDesignTemplates()
            .map((t) => t.id)
            .join(", ")}`,
        };
      }
      return { ok: true, value: byName.id };
    }
    return { ok: true, value: template.id };
  }
  if (step.id === "accent") {
    if (answer.length > 32) return { ok: false, error: "색상 값이 너무 깁니다." };
    return { ok: true, value: answer };
  }
  if (step.id === "avatar") {
    if (/^skip|없음|없어요|이니셜$/i.test(answer)) return { ok: true, value: "" };
    const url = sanitizeHttpsUrl(answer);
    if (!url) return { ok: false, error: "https 이미지 URL만 허용됩니다." };
    return { ok: true, value: url };
  }
  if (step.id === "firstLink") {
    const parsed = parseFirstLinkAnswer(answer);
    if ("error" in parsed && parsed.error) {
      return { ok: false, error: parsed.error };
    }
    if (parsed.skip) return { ok: true, value: "" };
    return { ok: true, value: `${parsed.label} | ${parsed.url}` };
  }
  if (step.id === "publish") {
    const lower = answer.toLowerCase();
    if (["yes", "y", "네", "공개", "true", "1"].includes(lower)) {
      return { ok: true, value: "yes" };
    }
    if (["no", "n", "아니오", "비공개", "false", "0"].includes(lower)) {
      return { ok: true, value: "no" };
    }
    return { ok: false, error: "yes 또는 no 로 답해주세요." };
  }
  return { ok: true, value: answer };
}

export function wizardProgress(stepId: string) {
  const idx = WIZARD_STEPS.findIndex((s) => s.id === stepId);
  return {
    current: Math.max(1, idx + 1),
    total: WIZARD_STEPS.length,
  };
}

export function wizardInstruction(step: WizardStep) {
  const choices = step.choices
    ? `\n선택지:\n${step.choices.map((c) => `- ${c.value}: ${c.label}`).join("\n")}`
    : "";
  return [
    "사용자에게 아래 질문을 그대로 묻고, 답변을 받은 뒤 answer_profile_wizard 도구를 호출하세요.",
    `질문: ${step.question}`,
    `힌트: ${step.hint}${choices}`,
  ].join("\n");
}

export function emptyDesignWithWizard(wizard: WizardState): PageDesign {
  return { wizard };
}
