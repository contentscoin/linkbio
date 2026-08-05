# Error log

[2026-08-05 14:05 KST]
- Error: `Failed to parse URL from https://api.0.0.1/sql` on `/bolbanjang`
- Cause: 셸에 남아 있던 `DATABASE_URL=postgresql://user:pass@127.0.0.1:5432/...` 가 Next보다 우선. Neon HTTP 드라이버가 `127.0.0.1` → `api.0.0.1` 로 변환.
- Fix: `unset DATABASE_URL` 후 `.env.local`(Neon)으로 `next dev` 재시작.
