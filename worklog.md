# Work log

[2026-08-05 10:37 KST]
- 사용자 확인: `bio.omo.co.kr` 가 LinkBio 정상 운영 도메인이었음. 리포(`contentscoin/linkbio`)도 맞음.
- 이전 "도메인 분리" 판단이 오해였음 → `src/proxy.ts` 차단 커밋 revert 로 복구.

[2026-08-04 13:10 KST]
- (철회) `bio.omo.co.kr` 호스트 차단 시도 — 사용자 피드백으로 잘못된 조치로 확인되어 2026-08-05 revert.

[2026-08-04 12:30 KST]
- MCP 연결 UI를 `/admin`에서 **`/settings`(마이페이지)** 로 이동. `/mypage` → settings 리다이렉트.
- 로그인/가입 후 `/settings` 진입. API URL·토큰·Cursor 가이드·curl 제공.
- admin 툴바에 「내 설정 · MCP」 링크. 토큰은 URL이 아니라 httpOnly 쿠키로 1회 표시.

[2026-08-03 06:40 KST]
- Neon DATABASE_URL 연결. drizzle-kit push는 레거시 스키마 충돌로 interactive 실패 → apply/align 스크립트로 컬럼 정렬 + social_channels 생성.
- seed:golf `bolbanjang` 5 links, verify:db OK.
- `npm run dev` · 공개 `/bolbanjang` 200 · MCP list_templates 8 · get/agent page links=5.
- 보안: 채팅에 DB 비밀번호 노출됨 → Neon에서 비밀번호 로테이션 권장.
