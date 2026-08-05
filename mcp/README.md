# OMO Bio MCP

개인 토큰은 로그인 후 `/settings`에서 발급합니다.

## Cursor

1. `/settings`에서 토큰 발급 → `mcp.json` 복사
2. Cursor Settings → Tools & MCP에 붙여넣기
3. `args` 경로를 이 리포의 `mcp/run.mjs` 절대 경로로 수정

또는 예시: `mcp/mcp.json.example`

## HTTP

```bash
curl -H "Authorization: Bearer <token>" \
  "https://bio.omo.co.kr/api/v1/agent?action=page&handle=<handle>"
```

Actions: `page`, `health` (GET) · `update_profile`, `upsert_link`, `delete_link` (POST)
