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
