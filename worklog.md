# Work log

[2026-08-05 13:50 KST]
- 사용자: Vercel에서 `linkbio-5vku76k9c` 프로모트 완료. 라이브 `bio.omo.co.kr` = **OMO Bio**.
- GitHub `contentscoin/linkbio` 는 예전 LinkBio 코드라 프로모트 배포와 불일치.
- 브랜치 `cursor/omo-bio-baseline-509c`: 주신 package.json + 라이브 UI/DB 기준으로 OMO Bio 베이스 재구성 시작.
- **주의**: 이 브랜치를 main에 머지하면 Git 연동 배포가 프로모트 버전을 덮어쓸 수 있음. 소스 동기화 검증 후 머지.

[2026-08-05 14:10 KST]
- OMO Bio 베이스 재구성 완료(초안): package.json 핀 버전, 한국어 랜딩/로그인/가입 위저드, fairway 공개 페이지, 기본 admin 편집기, Neon 듀얼 컬럼 스키마.
- 검증: `npm run typecheck` OK, `npm run build` OK, 로컬 `/` `/login` `/signup` `/bolbanjang` 200, `/admin`→`/login`.
- MCP(`/settings`, `/api/v1/agent`)는 라이브에도 없음 — 이후 OMO 베이스 위에 다시 붙일 예정.
- **머지 금지**: Preview가 프로모트 OMO Bio와 맞는지 확인 전 `main` 머지하지 말 것.

[2026-08-05 15:25 KST]
- OMO Bio 베이스 위에 개인 MCP 연결 복구: `/settings`(API URL+토큰 가이드), `/mypage`→settings, `/api/v1/agent`, `mcp/run.mjs`.
- 로그인/가입 후 `/settings` 랜딩. admin에「MCP · 설정」링크.
- 검증: typecheck/build OK. 토큰 스모크 — page 200, wrong handle 403, update_profile 200, global key health 200.

[2026-08-05 16:20 KST]
- 사용자 보고: bio.omo.co.kr `/login` 500 (Server Components render / digest)
- 재현: 프로덕션 서버 액션 POST가 digest 500. 페이지 GET은 정상.
- 수정: 프로덕션과 동일한 LoginForm(useActionState) + 방어적 loginAction 시그니처로 교체.

[2026-08-05 22:02 KST]
- 원격 MCP URL(`/api/mcp` Streamable HTTP) 추가 — Claude/ChatGPT/Cursor URL 연결용.
- 인증: Bearer / x-mcp-key / `?token=` 쿼리.
- 프로필생성도우미: start/answer/get_profile_wizard + prompt `profile_creation_helper`.
- 디자인 템플릿·아바타/배경 이미지·커스텀 CSS 도구 추가. 공개 페이지에서 design jsonb 렌더.
- `/settings`에 Cursor/Claude/ChatGPT 세팅 가이드 반영.
- 검증: typecheck OK, build OK (`/api/mcp` 라우트 포함).

[2026-08-05 22:20 KST]
- 사용자 피드백: 디자인 테마 기능이 없어 보임.
- 원인: OMO 재구성 후 admin은 프로필·링크만 있고, 테마/디자인은 CSS·공개페이지·MCP에만 존재.
- 수정: `/admin`에 디자인 템플릿·테마·꾸미기(레이아웃/카드/폰트/패턴/이미지/CSS)·미리보기 복구.

[2026-08-05 22:45 KST]
- 사용자 요청으로 PR #11 (`cursor/mcp-remote-wizard-509c`) main 머지 완료.

[2026-08-05 23:20 KST]
- 사용자: 버튼 디자인 기능 없음, linkstory.co.kr 참고 요청.
- `/admin`에 링크스토리식 **버튼 디자인**(스타일/모양/그림자/호버/색상) + 업종별 템플릿 카테고리 추가.
- 공개 페이지 `data-button` / `data-shadow` / `--button-fill|text` 렌더 + wipe 호버.

[2026-08-05 23:55 KST]
- 사용자 요청으로 PR #12 (`cursor/admin-button-design-509c`) main 머지 완료.

[2026-08-06 07:30 KST]
- 사용자: 템플릿 적용 시 에러.
- 원인: TemplatePicker 카테고리 필터가 선택 라디오를 unmount → templateId 미제출 → "디자인 템플릿을 선택하세요."
- 수정: controlled selection + 카테고리 변경 시 첫 템플릿 자동 선택, apply 액션 방어 강화.


[2026-08-06 09:41 KST]
- 사용자: 템플릿 적용이 여전히 깨짐.
- 재현: 프로덕션 `/admin`에서 템플릿 적용 시 `UnrecognizedActionError` (Server Action ID 불일치 / 배포 후 구 클라이언트) + POST `/admin` 404. 페이지가 "This page couldn't load"로 붕괴.
- 수정: 템플릿 적용을 Server Action 대신 `POST /api/admin/apply-template` 폼 제출로 전환(액션 ID 회전 회피). `templateId`는 hidden input으로 항상 전송. 나머지 admin 폼은 `SafeActionForm`으로 UnrecognizedActionError 시 자동 새로고침.


[2026-08-06 10:46 KST]
- 사용자: 로그인 실패 + 프로덕션 배포 요청.
- 원인 추정: 템플릿과 동일하게 Server Action ID 불일치로 loginAction 실패.
- 수정: 로그인폼을 `POST /api/auth/login` 일반 폼으로 전환. PR #13에 포함 후 main 머지·프로덕션 배포.


[2026-08-06 10:48 KST]
- PR #13 main 머지 완료 → 프로덕션 배포 `8716a31`.
- 검증: `POST /api/auth/login` QA 계정 → 303 `/settings` + 세션 쿠키. 잘못된 비밀번호 → `/login?error=...`.
- 템플릿 API도 세션으로 paper-note/fairway 적용 확인.


[2026-08-06 15:27 KST]
- 사용자: FMGS 목업 한계 피드백 + `/fmg` 캡처 요청 + P0 기능 개발 요청.
- 캡처: `/opt/cursor/artifacts/screenshots/fmg-top.webp`, `fmg-bottom.webp` (라임 CTA / 네이비 2열 / 1열 보조 링크 확인).
- P0 구현: featuredFill·tokens·sections·data-* 선택자, upsert_link(sortOrder/span/variant/section), upsert_section, get_preview_url.
- `/fmg` DB를 네이티브 tokens/sections로 이전(커스텀 CSS는 호버·높이만 유지).

[2026-08-06 16:08 KST]
- 사용자: 「기능개발해」 → P1 목업형 디자인 기능 구현 (PR #14 브랜치).
- 추가: link `iconKey`/`iconUrl`/`badge`, design `proofItems`/`logoUrl`/`headline`/`headlineHighlight`/`headerAlign`/`heroGraphic`.
- 공개 페이지: 로고·강조 헤드라인·골프 히어로·통계바·아이콘/배지/spotlight 카드 렌더 + CSS.
- MCP: `upsert_link`·`update_design` 확장, page-bundle 요약 필드 반영.
- DB: `scripts/migrate-link-icons.mjs` 실행 (icon_key/icon_url/badge).
- `/fmg`에 네이티브 P1 데이터 적용(아이콘·배지·proof·headline). customCss는 배포 전 라이브 폴백으로 유지.
- 검증: typecheck OK, build OK.

[2026-08-06 17:00 KST]
- 사용자  Clarification: 목업 이미지를 ‘직접 적용’이 아니라 MCP로 수정할 수 있는 **기능** 개발이 목적.
- 보강: upsert_link 부분 수정(linkId만으로 icon/badge/span 등 패치), list_design_capabilities 도구, design_editor 프롬프트, CTA+아이콘 가로 레이아웃 CSS, settings MCP 가이드 문구.
- /fmg 콘텐츠는 MCP로 사용자가 수정하도록 이 PR에서 건드리지 않음.
2026-08-06 17:11 KST
- PR #15 main 머지·프로덕션 배포 (a47523c). MCP 부분 upsert_link / list_design_capabilities / design_editor.

[2026-08-06 17:11 KST]
- PR #15 main 머지·프로덕션 배포 완료 (`a47523c`).
- MCP: 부분 upsert_link, list_design_capabilities, design_editor 프롬프트 라이브.

[2026-08-06 18:43 KST]
- Bioomo 렌더러 기능 보강: 링크 이미지 아이콘(iconImageUrl), 카드 슬롯 레이아웃(layout/iconPlacement/iconSize), 모바일 그리드(mobileColumns/mobileSpan), CTA 전용 렌더(showArrow/trailingIcon), 브랜드 로고 별칭(brandLogoUrl/logoImageUrl).
- MCP 입력 확장: upsert_link/upsert_section/update_design/list_design_capabilities.
- 슬롯별 data-role(card/icon/badge/content/title/sublabel/arrow) 노출 및 카드 minWidth/minHeight/padding 제어.

[2026-08-06 20:42 KST]
- PR #16 main 머지·프로덕션 배포 완료 (`34cbc03`).
- 슬롯형 렌더러(data-role), iconImageUrl/layout/mobileSpan/CTA 전용 경로 라이브 확인.

[2026-08-06 21:55 KST]
- P0 시안 시각 렌더러 기능 구현 브랜치 `cursor/bio-p0-visual-renderer-509c`.
- design: contentMaxWidth, logoImageUrl(+width/height/align), headlineSegments, heroGraphicUrl/size/position.
- link: leadingIconUrl, secondaryText, showDivider, arrowStyle(plain|circle), arrowPosition, cardLayout 별칭.
- 렌더러: page-root 포함 안정적 data-role, CTA 구분선/원형 화살표, customCss는 page-root 기준.
- DB migrate-link-icons.mjs 컬럼 추가 실행. MCP 0.5.0 upsert_link/update_design/capabilities 확장.
- /fmg 콘텐츠는 미적용(MCP 설정은 사용자). typecheck/build OK.

[2026-08-06 22:03 KST]
- PR #17 main 머지·프로덕션 배포 완료 (`7ca9f23`).
- 라이브 `bio.omo.co.kr`에서 `data-role=page-root` 및 CTA/arrow data-* 확인.

[2026-08-06 22:10 KST]
- 메인 랜딩(`/`) 하단 omo.co.kr 홍보 배너 추가.
- Bioomo 무료·MCP로 수정/디자인 고도화 가능 안내 문구 반영.

[2026-08-06 22:12 KST]
- PR #18 main 머지·프로덕션 배포 완료 (`36ae7bb`).
- 라이브 랜딩에서 `omo-promo` 배너·무료/MCP 안내 확인.

[2026-08-06 22:30 KST]
- 랜딩에 Bioomo 작업 과정 3단계 + `/fmg`(FMGS) 실제 샘플 미리보기 섹션 추가.

[2026-08-06 22:28 KST]
- PR #19 main 머지·프로덕션 배포 완료 (`90e499a`).
- 라이브 랜딩에서 작업 과정·`/fmg` 샘플 섹션 확인.

[2026-08-07 00:05 KST]
- P0 그리드/업로드: bento nth-child 자동확장 제거, span 저장값 우선, upload_asset+assets 테이블,
  CTA trailingText/subtitlePlacement, 카드 height/aspectRatio/gap, CSS 8k 오류, layoutDebug.
- 브랜치 `cursor/bio-p0-grid-upload-509c`.

[2026-08-07 06:15 KST]
- stdio MCP(mcp/server.mjs) 스키마 전면 갱신(upload_asset·최신 필드, additionalProperties 허용).
- upload_asset에 width/height/mimeType 반환. typography·sectionGap 필드 추가.
- HTTP MCP 0.7.0, settings/design_editor 가이드 갱신.

[2026-08-07 06:55 KST]
- Page Schema + 템플릿 엔진 전환 시작: `page-schema`/`schema-templates`/`schema-ops`.
- MCP 도구: open_profile_designer, list/get_templates, create_page_from_template,
  get/update_page_schema·section·component, render_preview, validate_page,
  save_draft, publish_page, restore_version.
- MCP Apps UI 리소스 `ui://bioomo/profile-designer.html` + `/designer` 5단계 위젯.
- 스키마→디자인 토큰/링크 동기화, 버전 스냅샷(draft/publish/restore).
- HTTP/stdio MCP 0.8.0. CSS 직접 주입 대신 구조화 스키마 권장.
- typecheck/build OK. 브랜치 `cursor/page-schema-designer-app-509c`.

[2026-08-07 07:00 KST]
- PR #22 main 머지 (`01bff00`). Production 자동 배포가 바로 안 떠서 main에 트리거 커밋 푸시.

[2026-08-07 07:03 KST]
- Production 배포 완료 (`8dd14e5`). 라이브 `/designer` 200, `x-matched-path=/designer` 확인.
- PR #22 MERGED. Page Schema MCP Apps + 템플릿 엔진 프로덕션 반영.

[2026-08-07 11:15 KST]
- MCP 수정: siteOrigin이 *.vercel.app을 반환하지 않도록 고정(bio.omo.co.kr).
- settings MCP 가이드를 Page Schema 중심으로 갱신, ChatGPT는 ?token= URL 권장.
- list_design_capabilities / profile_creation_helper에서 set_custom_css 비권장.
- HTTP/stdio MCP 0.8.1.

[2026-08-07 11:45 KST]
- ERR_BLOCKED_BY_CSP 수정: ChatGPT 위젯이 bio.omo.co.kr를 중첩 iframe으로 넣어
  샌드박스 CSP에 막히던 문제. self-contained 위젯 + _meta.ui.csp /
  openai/widgetCSP(frame/connect/resource/redirect domains) 선언.
- /designer frame-ancestors에 chatgpt.com 등 허용. MCP 0.8.2.

[2026-08-07 13:10 KST]
- 원인: 공개 `/{handle}`가 pageSchema를 무시하고 레거시 design+links+Fairway를 렌더.
- 수정: `resolvePublicRender` — `fmgs-*` 등 schema-driven 템플릿은 publishedSchema 단일 기준.
- `fmgs-exact` 템플릿(853×1844 canvas, spotlight 파미골, full-width shortcuts, FMGS footer).
- schema 필드 매핑: logoUrl, heroGraphicUrl, CTA icon/divider/arrow, variant/span/cardMinHeight, footer.
- publish 시 pages.theme/accent 동기화 + revalidatePath. navy-lime CSS 추가.
- typecheck/build OK. 브랜치 `cursor/fmgs-exact-schema-renderer-509c`.

[2026-08-07 13:17 KST]
- PR #25 main 머지 (`710140f`). Production 배포 트리거.
