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
