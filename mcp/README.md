# LinkBio MCP

Cursor(또는 다른 MCP 클라이언트)가 LinkBio 페이지를 **조회·정리·수정·디자인 개인화**할 수 있게 하는 stdio MCP 서버입니다.  
내부적으로 Next 앱의 `/api/v1/agent` 를 호출합니다.

## 사전 조건

1. `.env.local`에 `MCP_API_KEY`(24자 이상) 설정  
2. 같은 값을 Cursor MCP `env.MCP_API_KEY`에 넣기  
3. `npm run db:push` 후 **`npm run dev`** 로 앱 기동 (`LINKBIO_BASE_URL`, 기본 `http://localhost:3000`)  
4. Cursor에서 `"type": "stdio"` 로 서버 등록 후 **완전 재시작**

## Cursor 등록 예시

전역 `~/.cursor/mcp.json` 또는 프로젝트 `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "linkbio": {
      "type": "stdio",
      "command": "node",
      "args": ["C:/Users/USER/Projects/linkbio/mcp/run.mjs"],
      "env": {
        "LINKBIO_BASE_URL": "http://localhost:3000",
        "MCP_API_KEY": "앱-.env.local-과-동일한-값"
      }
    }
  }
}
```

- `run.mjs`: 프로젝트 루트로 cwd를 맞춘 뒤 `server.mjs` 실행 (SDK 모듈 안정화)  
- Settings → Tools & MCP 에서 `linkbio` **녹색(ready)** 확인  

예시 파일: `mcp/mcp.json.example`

## 도구

| 도구 | 설명 | 주요 인자 |
|------|------|-----------|
| `list_templates` | 8개 템플릿 + 기본 디자인 토큰 | (없음) |
| `get_page` | 프로필·링크·SNS·디자인 요약 | `handle` |
| `apply_template` | 템플릿 적용 (design 초기화 포함) | `handle`, `theme` |
| `update_design` | 배경/색/버튼/폰트/`customCss` 패치 | `handle`, `design` |
| `update_profile` | 표시명·바이오·메일·공개/공유 플래그 | `handle`, … |
| `import_social` | SNS URL OG 메타 import | `handle`, `url` |
| `upsert_link` | 링크 생성 또는 수정 | `handle`, `label`, `url`, (`linkId`) |
| `delete_link` | 링크 삭제 | `handle`, `linkId` |

## 사용 예 (에이전트에게 말할 내용)

- “`bolbanjang` 페이지 정보 가져와” → `get_page`  
- “템플릿 `dusk` 적용해” → `apply_template`  
- “배경을 더 어둡게, accent `#7cb89a`” → `update_design`  
- “YouTube 채널 URL import” → `import_social`  
- “레슨 패키지 링크 추가” → `upsert_link`  

커스텀 CSS 예:

```json
{
  "handle": "bolbanjang",
  "design": {
    "customCss": ".public-shell { max-width: 420px; } .bio-link { letter-spacing: 0.02em; }"
  }
}
```

## HTTP API (디버그)

MCP와 동일한 백엔드:

```bash
# 템플릿 목록
curl -H "Authorization: Bearer $MCP_API_KEY" \
  "http://localhost:3000/api/v1/agent?action=templates"

# 페이지 조회
curl -H "Authorization: Bearer $MCP_API_KEY" \
  "http://localhost:3000/api/v1/agent?action=page&handle=bolbanjang"

# 디자인 패치
curl -X POST -H "Authorization: Bearer $MCP_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"update_design\",\"handle\":\"bolbanjang\",\"design\":{\"accentColor\":\"#1a5c45\"}}" \
  "http://localhost:3000/api/v1/agent"
```

## 문제 해결

| 증상 | 점검 |
|------|------|
| MCP가 loading / auth만 보임 | `"type":"stdio"` 여부, Cursor 완전 재시작 |
| `fetch failed` / Unauthorized | 앱 `npm run dev` 실행 여부, API 키 일치 |
| `Page not found` | `db:push` · 시드/가입으로 해당 `handle` 존재 확인 |
| 모듈 resolve 오류 | `args`를 `mcp/run.mjs`로, 프로젝트에 `npm install` |

## 로컬 단독 실행

```bash
npm run mcp
```

stdin으로 MCP JSON-RPC를 받습니다. 일반 사용은 Cursor가 프로세스를 띄웁니다.
