# LinkBio

Postgres 기반 링크인바이오. 공개 `/{handle}` · 관리자 편집 · 템플릿/꾸미기 · SNS 메타 가져오기 · 공유/메일 · **MCP 에이전트 API**.

## Getting Started

```powershell
Copy-Item .env.example .env.local
```

채울 값:

- `DATABASE_URL` — Neon 등 Postgres
- `SESSION_SECRET` — 32자 이상
- `NEXT_PUBLIC_SITE_URL` — 로컬은 `http://localhost:3000`
- `MCP_API_KEY` — 에이전트 API용 (24자 이상)

```bash
npm install
npm run db:push
npm run dev
```

## 새 기능

### 템플릿 & 꾸미기
Admin에서 8개 템플릿(Field, Studio, Ember, Dusk, Fairway, Ink, Meadow, Tournament) 적용 후 배경·버튼·폰트·커스텀 CSS 조정.

### SNS 채널
채널 URL 입력 → OG/공개 메타 수집 → 공개 페이지 카드.

### 공유 / 메일
공개 페이지 Share · Copy link · Email CTA (`contactEmail`).

### MCP (에이전트)
HTTP: `GET/POST /api/v1/agent` + `Authorization: Bearer $MCP_API_KEY`

stdio MCP: `mcp/server.mjs` — Cursor 설정 예시는 `mcp/mcp.json.example`.

도구: `list_templates`, `get_page`, `apply_template`, `update_design`, `update_profile`, `import_social`, `upsert_link`, `delete_link`.

커스텀 CSS 예:

```json
{
  "action": "update_design",
  "handle": "bolbanjang",
  "design": {
    "customCss": ".public-shell { max-width: 420px; } .bio-link { letter-spacing: 0.02em; }"
  }
}
```

## Scripts

- `npm run typecheck` / `test` / `build`
- `npm run db:generate` / `db:push` / `db:studio`
- `npm run verify:db` / `seed:golf`

Vercel 빌드: `db:push` → `verify:db` → `build`.

## Security

- bcrypt cost 12, HS256 HttpOnly 세션
- Server Actions ownership 재검증
- 링크/배경 이미지 URL은 http(s)만
- 커스텀 CSS는 `@import` / `expression` 등 차단
- Rate limit: 기본 in-memory, 운영은 `UPSTASH_REDIS_REST_*`
- MCP: `MCP_API_KEY` bearer + rate limit (`mcp/README.md`)
- Rate limit은 in-memory (실트래픽 전 Upstash/KV 권장)
