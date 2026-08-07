import { canonicalSiteOrigin, siteOrigin } from "@/lib/site-url";

export const PROFILE_DESIGNER_URI = "ui://bioomo/profile-designer.html";

const TEMPLATES = [
  { id: "fmgs-premium", name: "FMGS Premium", desc: "골프·마케팅 2×2 서비스" },
  { id: "corporate-grid", name: "Corporate Grid", desc: "기업형 그리드" },
  { id: "personal-branding", name: "Personal Branding", desc: "개인 브랜딩" },
  { id: "product-launch", name: "Product Launch", desc: "제품 출시" },
  { id: "portfolio", name: "Portfolio", desc: "포트폴리오" },
  { id: "minimal-link", name: "Minimal Link", desc: "최소 링크" },
  { id: "photo-hero", name: "Photo Hero", desc: "포토 히어로" },
];

/** CSP metadata for ChatGPT/MCP Apps sandboxed iframe. */
export function profileDesignerResourceMeta() {
  const origin = siteOrigin();
  const domains = Array.from(
    new Set([origin, canonicalSiteOrigin(), "https://fonts.googleapis.com", "https://fonts.gstatic.com"]),
  );
  return {
    ui: {
      prefersBorder: true,
      csp: {
        connectDomains: domains,
        resourceDomains: domains,
        // Nested iframe to /designer is optional; declared so hosts that allow it work.
        frameDomains: [origin, canonicalSiteOrigin()],
      },
    },
    "openai/widgetCSP": {
      connect_domains: domains,
      resource_domains: domains,
      frame_domains: [origin, canonicalSiteOrigin()],
      redirect_domains: [origin, canonicalSiteOrigin()],
    },
  };
}

/**
 * Self-contained MCP Apps widget (no nested iframe required).
 * ChatGPT CSP blocks external iframes unless frameDomains is set — we avoid
 * relying on nested frames and call tools via the host bridge instead.
 */
export function profileDesignerWidgetHtml(opts?: {
  handle?: string;
  step?: string;
}) {
  const origin = siteOrigin();
  const handle = opts?.handle || "";
  const step = opts?.step || "guide";
  const templatesJson = JSON.stringify(TEMPLATES);
  const designerUrl = `${origin}/designer?embed=1&handle=${encodeURIComponent(handle)}&step=${encodeURIComponent(step)}`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bioomo Profile Designer</title>
  <style>
    :root { color-scheme: dark; --bg:#071525; --panel:#0f2438; --line:#1d3a55; --text:#f2f6fb; --muted:#9fb0c3; --accent:#c9f232; --ink:#0b1f33; }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; background: linear-gradient(180deg,#071525,#0a1a2c); color: var(--text); font-family: "Noto Sans KR", "IBM Plex Sans KR", sans-serif; }
    .shell { padding: 16px; max-width: 720px; margin: 0 auto; }
    .brand { font-size: 28px; font-weight: 900; letter-spacing: -0.04em; color: var(--accent); margin: 0; }
    h1 { font-size: 1.05rem; margin: 4px 0 0; font-weight: 600; }
    .sub { color: var(--muted); font-size: 0.85rem; margin: 6px 0 14px; }
    .warn { background: #3a2410; border: 1px solid #8a5a20; color: #ffd27a; padding: 10px 12px; border-radius: 12px; font-size: 12px; margin-bottom: 14px; line-height: 1.45; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
    label { display: grid; gap: 4px; font-size: 12px; color: var(--muted); flex: 1; min-width: 140px; }
    input, select, button, textarea { font: inherit; }
    input, select, textarea { background: #0a1c2e; border: 1px solid var(--line); color: var(--text); border-radius: 10px; padding: 10px 12px; width: 100%; }
    button { border: 1px solid var(--line); background: transparent; color: var(--text); border-radius: 999px; padding: 9px 14px; cursor: pointer; }
    button.primary { background: var(--accent); color: var(--ink); border-color: var(--accent); font-weight: 700; }
    button:disabled { opacity: 0.5; cursor: wait; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
    .tpl { text-align: left; border-radius: 14px; padding: 12px; background: #0a1c2e; border: 1px solid var(--line); display: grid; gap: 6px; }
    .tpl.selected { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
    .tpl strong { font-size: 0.92rem; }
    .tpl span { color: var(--muted); font-size: 0.75rem; }
    .log { margin-top: 12px; background: #0a1c2e; border: 1px solid var(--line); border-radius: 12px; padding: 10px 12px; font-size: 12px; white-space: pre-wrap; color: var(--muted); max-height: 180px; overflow: auto; }
    .ok { color: var(--accent); }
    .err { color: #ff8f8f; }
    a.link { color: var(--accent); }
  </style>
</head>
<body>
  <div class="shell">
    <p class="brand">Bioomo</p>
    <h1>프로필 디자이너</h1>
    <p class="sub">Page Schema · CSS 없음 · ChatGPT 위젯 내장 UI</p>
    <div class="warn">ChatGPT 샌드박스는 외부 iframe을 CSP로 막을 수 있습니다. 이 위젯은 <b>중첩 iframe 없이</b> MCP 도구를 직접 호출합니다. 전체 화면 편집은 아래 링크로 새 창에서 여세요.</div>
    <div class="row">
      <label>handle<input id="handle" value="${handle.replace(/"/g, "&quot;")}" placeholder="fmg" /></label>
      <label>템플릿
        <select id="template"></select>
      </label>
    </div>
    <div class="row">
      <button type="button" class="primary" id="btnApply">템플릿 적용</button>
      <button type="button" id="btnValidate">검증</button>
      <button type="button" id="btnPublish">게시</button>
      <button type="button" id="btnPreview">미리보기 URL</button>
    </div>
    <div class="grid" id="tplGrid"></div>
    <p class="sub" style="margin-top:14px">전체 화면: <a class="link" id="openFull" href="${designerUrl}" target="_blank" rel="noopener">디자이너 새 창 열기</a> · 공개: <a class="link" id="openPublic" href="${origin}/${handle}" target="_blank" rel="noopener">/${handle || "…"}</a></p>
    <div class="log" id="log">도구 호출 로그가 여기에 표시됩니다.</div>
  </div>
  <script>
    const TEMPLATES = ${templatesJson};
    const ORIGIN = ${JSON.stringify(origin)};
    const logEl = document.getElementById("log");
    const handleEl = document.getElementById("handle");
    const templateEl = document.getElementById("template");
    const grid = document.getElementById("tplGrid");
    let selected = TEMPLATES[0] && TEMPLATES[0].id;

    function log(msg, cls) {
      const line = document.createElement("div");
      if (cls) line.className = cls;
      line.textContent = msg;
      logEl.prepend(line);
    }

    function syncLinks() {
      const h = (handleEl.value || "").trim();
      document.getElementById("openFull").href = ORIGIN + "/designer?embed=1&handle=" + encodeURIComponent(h) + "&step=template";
      document.getElementById("openPublic").href = ORIGIN + "/" + encodeURIComponent(h || "");
      document.getElementById("openPublic").textContent = "/" + (h || "…");
    }

    TEMPLATES.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id; opt.textContent = t.name;
      templateEl.appendChild(opt);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tpl" + (t.id === selected ? " selected" : "");
      btn.innerHTML = "<strong>" + t.name + "</strong><span>" + t.desc + "</span>";
      btn.onclick = () => {
        selected = t.id;
        templateEl.value = t.id;
        [...grid.children].forEach((c) => c.classList.remove("selected"));
        btn.classList.add("selected");
      };
      grid.appendChild(btn);
    });
    templateEl.value = selected;
    templateEl.onchange = () => { selected = templateEl.value; };
    handleEl.oninput = syncLinks;
    syncLinks();

    async function callTool(name, args) {
      if (window.openai && typeof window.openai.callTool === "function") {
        return window.openai.callTool(name, args || {});
      }
      throw new Error("Host tools/call 불가 — ChatGPT MCP Apps에서 열거나 새 창 디자이너를 사용하세요.");
    }

    async function run(name, args) {
      log("→ " + name + " " + JSON.stringify(args || {}));
      try {
        const result = await callTool(name, args);
        const text = typeof result === "string" ? result : JSON.stringify(result, null, 2);
        log(text.slice(0, 1200), "ok");
        return result;
      } catch (e) {
        log(String(e && e.message || e), "err");
        throw e;
      }
    }

    document.getElementById("btnApply").onclick = async () => {
      const handle = handleEl.value.trim();
      if (!handle) return log("handle 필요", "err");
      await run("create_page_from_template", { handle, templateId: selected, persist: true });
    };
    document.getElementById("btnValidate").onclick = async () => {
      const handle = handleEl.value.trim();
      await run("validate_page", { handle });
    };
    document.getElementById("btnPublish").onclick = async () => {
      const handle = handleEl.value.trim();
      await run("publish_page", { handle });
    };
    document.getElementById("btnPreview").onclick = async () => {
      const handle = handleEl.value.trim();
      await run("render_preview", { handle });
    };

    document.getElementById("openFull").addEventListener("click", (e) => {
      const href = document.getElementById("openFull").href;
      if (window.openai && typeof window.openai.openExternal === "function") {
        e.preventDefault();
        window.openai.openExternal({ href });
      }
    });
  </script>
</body>
</html>`;
}
