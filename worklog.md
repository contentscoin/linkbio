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

[2026-08-05 21:40 KST]
- `/fmg` 페이지 디자인: theme `fairway`, accent `#cc4100`, bio·FMGS 링크 카피 정리, 이니셜 `신태` (agent API 적용, 라이브 즉시 반영).
- FairwayScene 실비주얼 복구(언덕 SVG, 골프공, 깃발, 비행 궤적) + AuroraScene 연결 + featured `추천` 배지.
- agent `update_profile`에 `design` JSON(layout/pattern/effect 등) 반영 가능하도록 확장.
- 검증: `npm run typecheck` OK, `npm run build` OK.

[2026-08-05 21:52 KST]
- `/fmg` 프로필 FMGS 사이트 기준으로 임의 완성 (agent API).
- displayName=FMGS, bio=골프 마케팅 카피, accent=#cc4100, fairway.
- 링크 10개: 공식 사이트(featured), 파미골/Luckyball/Members/CEO Golf/광고&SI, 포트폴리오, 회사소개, 상담, 카카오.

[2026-08-05 22:00 KST]
- 공개 페이지 디자인 고도화: Outfit 디스플레이 폰트, fairway 글래스 링크/히어로 타이포, 섹션 그룹(사업·알아보기·문의).
- FairwayScene: sky/haze/bunker/gradient hills, 추가 구름·비행 궤적.
- agent upsert_link에 `section` 지원, `scripts/polish-fmg.mjs`로 배포 후 섹션·design 재적용.
- 검증: typecheck/build OK.
