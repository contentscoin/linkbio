# Work log

[2026-08-03 06:40 KST]
- Neon DATABASE_URL 연결. drizzle-kit push는 레거시 스키마 충돌로 interactive 실패 → apply/align 스크립트로 컬럼 정렬 + social_channels 생성.
- seed:golf `bolbanjang` 5 links, verify:db OK.
- `npm run dev` · 공개 `/bolbanjang` 200 · MCP list_templates 8 · get/agent page links=5.
- 보안: 채팅에 DB 비밀번호 노출됨 → Neon에서 비밀번호 로테이션 권장.
