# Work log

[2026-08-03 16:05 KST]
- MCP 체크: stdio initialize + tools/list 8종 OK · Bearer/`x-mcp-key` 인증 OK · list_templates→에이전트 8템플릿 OK.
- 이슈: DB 없는 환경에서 get_page 500 빈본문 → MCP가 JSON 파싱 예외. agentFetch  hardening.
- 이슈: `mcp/mcp.json.example`가 server.mjs 가리킴 → run.mjs로 통일, `npm run mcp`도 run.mjs.
- 테스트: `tests/mcp-stdio.test.ts` 추가 (tools/list + short API key). 전체 12 pass.
- live get_page(bolbanjang)는 Neon DATABASE_URL 없어 재검증 불가.

[2026-08-03 06:40 KST]
- Neon DATABASE_URL 연결. drizzle-kit push는 레거시 스키마 충돌로 interactive 실패 → apply/align 스크립트로 컬럼 정렬 + social_channels 생성.
- seed:golf `bolbanjang` 5 links, verify:db OK.
- `npm run dev` · 공개 `/bolbanjang` 200 · MCP list_templates 8 · get/agent page links=5.
- 보안: 채팅에 DB 비밀번호 노출됨 → Neon에서 비밀번호 로테이션 권장.
