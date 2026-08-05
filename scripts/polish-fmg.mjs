#!/usr/bin/env node
/**
 * Apply FMGS section grouping + design polish via agent API.
 * Usage: AGENT_TOKEN=lbmcp_... node scripts/polish-fmg.mjs
 * Optional: AGENT_API=https://bio.omo.co.kr/api/v1/agent
 */
const token = process.env.AGENT_TOKEN;
const api = process.env.AGENT_API || "https://bio.omo.co.kr/api/v1/agent";
if (!token) {
  console.error("AGENT_TOKEN required");
  process.exit(1);
}

async function post(body) {
  const res = await fetch(api, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(JSON.stringify(data));
  return data;
}

await post({
  action: "update_profile",
  handle: "fmg",
  displayName: "FMGS",
  bio: "골프 마케팅의 새로운 기준을 만듭니다.\n58만 골퍼 DB · 브랜드 파트너십 · 멤버십",
  theme: "fairway",
  accent: "#cc4100",
  design: {
    layout: "stack",
    effect: "glow",
    card: "glass",
    size: "roomy",
    radius: "round",
    effectCard: "shine",
    font: "sans",
  },
});

const links = [
  ["6979e2e5-5683-4a23-872a-cf868b1ce039", "FMGS 공식 사이트", "58만 골퍼 DB · Total Golf Marketing", "https://www.fmgs.co.kr/", true, ""],
  ["9d241cf3-c789-4ab1-978b-b9e22e482708", "파미골 (FMG)", "골프 스폰서 매칭 플랫폼", "https://www.fmgs.co.kr/business/fmg", false, "사업"],
  ["08f7f4db-a4b5-4d06-a604-0ec713d55726", "FMG Luckyball", "홀인원공 정기구독 · 커스텀 인쇄", "https://www.fmgs.co.kr/business/luckyball", false, "사업"],
  ["87025ee2-6dd7-4c39-b01e-082788a3ce33", "FMG Members", "일본·태국 해외 골프 멤버십", "https://www.fmgs.co.kr/business/members", false, "사업"],
  ["6559bcb2-d9d4-41dc-b244-f2d489763311", "FMG CEO Golf", "찾아가는 프리미엄 레슨", "https://www.fmgs.co.kr/business/ceo-golf", false, "사업"],
  ["03b78733-72a2-4829-a772-b06545d70c55", "광고 & SI", "타겟 마케팅 · 웹/앱 개발", "https://www.fmgs.co.kr/business/ads-si", false, "사업"],
  ["0572f78f-9226-4faa-ba16-a6d2faacf0b1", "포트폴리오", "웹·앱·영상 프로젝트 사례", "https://www.fmgs.co.kr/portfolio", false, "알아보기"],
  ["f4305efa-210a-4de6-9fd0-a21abf43136d", "회사 소개", "비전 · 핵심 역량 · History", "https://www.fmgs.co.kr/about", false, "알아보기"],
  ["e9325fff-b957-4d2f-ba69-3fd7efaf4463", "무료 상담 신청", "24시간 내 맞춤 제안", "https://www.fmgs.co.kr/contact", false, "문의"],
  ["c8edc86c-c61f-4df0-a5fc-da206ef7bb1f", "카카오톡 상담", "FMGS 카카오 채널", "http://pf.kakao.com/_xfIxecG", false, "문의"],
];

for (const [linkId, label, sublabel, url, featured, section] of links) {
  await post({
    action: "upsert_link",
    handle: "fmg",
    linkId,
    label,
    sublabel,
    url,
    featured,
    visible: true,
    section,
  });
  console.log("updated", label, section || "(featured)");
}

console.log("FMG_POLISH_OK");
