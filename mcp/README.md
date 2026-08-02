# LinkBio MCP

에이전트가 페이지를 조회·수정·디자인 개인화할 수 있는 stdio MCP 서버입니다.

## 준비

1. Next 앱 `.env.local`에 `MCP_API_KEY`(24자 이상) 설정
2. 앱 실행: `npm run dev`
3. Cursor MCP에 등록 (`mcp.json.example` 참고)

```json
{
  "mcpServers": {
    "linkbio": {
      "command": "node",
      "args": ["C:/Users/USER/Projects/linkbio/mcp/server.mjs"],
      "env": {
        "LINKBIO_BASE_URL": "http://localhost:3000",
        "MCP_API_KEY": "same-as-app-MCP_API_KEY"
      }
    }
  }
}
```

## Tools

| Tool | 역할 |
|------|------|
| `list_templates` | 템플릿 + 기본 디자인 |
| `get_page` | 프로필·링크·SNS·디자인 요약 |
| `apply_template` | 템플릿 적용 |
| `update_design` | 배경/색/커스텀 CSS 패치 |
| `update_profile` | 표시명·바이오·메일·공개 플래그 |
| `import_social` | SNS URL OG 가져오기 |
| `upsert_link` / `delete_link` | 링크 버튼 CRUD |

HTTP로 직접 호출할 때:

```bash
curl -H "Authorization: Bearer $MCP_API_KEY" \
  "http://localhost:3000/api/v1/agent?action=page&handle=bolbanjang"
```
