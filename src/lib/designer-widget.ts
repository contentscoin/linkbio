import { siteOrigin } from "@/lib/site-url";

export const PROFILE_DESIGNER_URI = "ui://bioomo/profile-designer.html";

/** MCP Apps UI shell — embeds Bioomo designer; calls tools via host bridge when available. */
export function profileDesignerWidgetHtml(opts?: {
  handle?: string;
  step?: string;
}) {
  const origin = siteOrigin();
  const handle = opts?.handle || "";
  const step = opts?.step || "guide";
  const designerSrc = `${origin}/designer?embed=1&handle=${encodeURIComponent(handle)}&step=${encodeURIComponent(step)}`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bioomo Profile Designer</title>
  <style>
    :root { color-scheme: light; }
    html, body { margin: 0; height: 100%; background: #0b1f33; font-family: "Pretendard", "Noto Sans KR", sans-serif; color: #f4f7fb; }
    .shell { display: flex; flex-direction: column; height: 100%; }
    .bar { display: flex; gap: 8px; align-items: center; padding: 10px 12px; background: #132a42; border-bottom: 1px solid #1e3a55; font-size: 13px; }
    .bar strong { letter-spacing: -0.02em; }
    .bar span { opacity: 0.75; }
    iframe { flex: 1; width: 100%; border: 0; background: #0b1f33; }
    .hint { padding: 8px 12px; font-size: 12px; opacity: 0.8; border-top: 1px solid #1e3a55; }
  </style>
</head>
<body>
  <div class="shell">
    <div class="bar">
      <strong>Bioomo</strong>
      <span>템플릿 · 콘텐츠 · 미리보기</span>
      <span id="handleLabel"></span>
    </div>
    <iframe id="frame" title="Bioomo designer" allow="clipboard-write"></iframe>
    <div class="hint">CSS를 직접 쓰지 마세요. 허용된 옵션만 선택하면 동일한 React 렌더러로 미리보기와 공개 페이지가 맞춰집니다.</div>
  </div>
  <script>
    const params = new URLSearchParams(location.search);
    const toolInput = (window.openai && window.openai.toolInput) || {};
    const handle = toolInput.handle || params.get("handle") || ${JSON.stringify(handle)};
    const step = toolInput.step || params.get("step") || ${JSON.stringify(step)};
    const origin = ${JSON.stringify(origin)};
    const src = origin + "/designer?embed=1&handle=" + encodeURIComponent(handle || "") + "&step=" + encodeURIComponent(step || "guide");
    document.getElementById("frame").src = src;
    document.getElementById("handleLabel").textContent = handle ? ("@" + handle) : "";

    window.addEventListener("message", async (event) => {
      if (!event.data || event.data.source !== "bioomo-designer") return;
      const { type, payload } = event.data;
      try {
        if (type === "callTool" && window.openai && typeof window.openai.callTool === "function") {
          const result = await window.openai.callTool(payload.name, payload.args || {});
          event.source && event.source.postMessage({ source: "bioomo-host", type: "toolResult", id: payload.id, result }, "*");
        }
      } catch (err) {
        event.source && event.source.postMessage({
          source: "bioomo-host",
          type: "toolResult",
          id: payload && payload.id,
          error: String(err && err.message || err),
        }, "*");
      }
    });
  </script>
</body>
</html>`;
}
