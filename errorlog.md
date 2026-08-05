# Error log

[2026-08-05 14:05 KST]
- Error: `Failed to parse URL from https://api.0.0.1/sql` on `/bolbanjang`
- Cause: 셸에 남아 있던 `DATABASE_URL=postgresql://user:pass@127.0.0.1:5432/...` 가 Next보다 우선. Neon HTTP 드라이버가 `127.0.0.1` → `api.0.0.1` 로 변환.
- Fix: `unset DATABASE_URL` 후 `.env.local`(Neon)으로 `next dev` 재시작.

[2026-08-05 16:20 KST]
- Error: `/login` 500 + "An error occurred in the Server Components render" (chunk `25o46h8mdjlrg.js`)
- Where: 프로모트된 `bio.omo.co.kr` 로그인 제출(서버 액션)
- Cause: 프로덕션 LoginForm은 `useActionState`인데, 액션이 FormData 단일 인자처럼 동작/파싱되면 `formData.get`에서 TypeError → 500 digest
- Fix (PR 브랜치): `LoginForm` + `useActionState`, `loginAction(prev, formData)` 방어적 시그니처, 실패 시 state 반환(리다이렉트 에러 쿼리 제거)
