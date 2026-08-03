# Work log

[2026-08-03 13:35 KST]
- 프로젝트 헬스체크: lint OK · typecheck 실패(`scripts/apply-schema.ts` row 타입) → `String(row.table_name)`로 수정 후 OK.
- test 10/10 pass · `next build` OK (라우트 `/`, `/[handle]`, `/admin`, `/api/v1/agent`, `/login`, `/signup`).
- 이 환경에 `DATABASE_URL`/`.env.local` 없음 → live `verify:db`·`/bolbanjang` HTTP 재검증은 불가 (이전 worklog 기록에 의존).
- npm audit: moderate 5 · high 4 (의존성 취약점, 앱 로직 외).

[2026-08-03 06:40 KST]
- Neon DATABASE_URL 연결. drizzle-kit push는 레거시 스키마 충돌로 interactive 실패 → apply/align 스크립트로 컬럼 정렬 + social_channels 생성.
- seed:golf `bolbanjang` 5 links, verify:db OK.
- `npm run dev` · 공개 `/bolbanjang` 200 · MCP list_templates 8 · get/agent page links=5.
- 보안: 채팅에 DB 비밀번호 노출됨 → Neon에서 비밀번호 로테이션 권장.
