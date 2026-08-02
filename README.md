# LinkBio

Postgres 기반 **링크인바이오** 앱입니다.  
크리에이터·운영자가 공개 프로필 페이지(`/{handle}`)를 만들고, 로그인된 관리자 화면에서 편집하며, Cursor MCP 에이전트로 조회·수정·디자인 개인화까지 할 수 있습니다.

## 무엇이 가능한가

| 영역 | 설명 |
|------|------|
| 공개 페이지 | `/{handle}` — 아바타·바이오·링크 버튼·SNS 카드·공유/메일 CTA |
| 관리자 | `/admin` — 프로필, 템플릿 8종, 꾸미기, SNS import, 링크 CRUD, 라이브 미리보기 |
| SNS | 채널 URL → OG/공개 메타 수집 → 카드로 표시 |
| 공유·메일 | Share / 링크 복사 / `mailto` 연락 |
| MCP 에이전트 | stdio MCP + HTTP `/api/v1/agent` 로 페이지·디자인·링크 제어 |
| 보안 | bcrypt(12), JWT 세션, ownership 재검증, URL/CSS 가드, rate limit |

## 기술 스택

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Drizzle ORM** + **Neon** (Postgres serverless)
- **jose** (HS256 세션) · **bcryptjs**
- MCP: `@modelcontextprotocol/sdk` (`mcp/server.mjs`)

## 빠른 시작

### 1) 환경 변수

```powershell
Copy-Item .env.example .env.local
```

`.env.local`에 다음을 채웁니다.

| 변수 | 설명 |
|------|------|
| `DATABASE_URL` | Neon 등 Postgres 연결 문자열 (`sslmode=require` 권장) |
| `SESSION_SECRET` | 세션 서명 키 **32자 이상** |
| `NEXT_PUBLIC_SITE_URL` | 로컬은 `http://localhost:3000` |
| `MCP_API_KEY` | MCP/에이전트 API 키 **24자 이상** (Cursor MCP env와 **동일**해야 함) |
| `UPSTASH_REDIS_REST_URL` / `TOKEN` | (선택) 운영 rate limit |

시크릿 생성 예:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2) 설치 · 스키마 · 실행

```bash
npm install
npm run db:push
npm run dev
```

브라우저: [http://localhost:3000](http://localhost:3000)

### 3) (선택) 골프 프로필 시드

```powershell
$env:DATABASE_URL="postgresql://..."
$env:SEED_EMAIL="you@example.com"
$env:SEED_PASSWORD="10-character-minimum"
$env:SEED_HANDLE="bolbanjang"
npm run seed:golf
```

시드 후 공개 페이지: `http://localhost:3000/bolbanjang`

## 화면 · 라우트

| 경로 | 설명 |
|------|------|
| `/` | 랜딩 (브랜드 히어로) |
| `/signup` · `/login` | 가입 · 로그인 |
| `/admin` | 비공개 편집기 (세션 필요) |
| `/[handle]` | 공개 링크인바이오 |
| `/api/v1/agent` | MCP/에이전트 HTTP API |

## 템플릿 & 꾸미기

관리자 **Templates**에서 템플릿을 고르면 배경·버튼·폰트 기본값이 적용됩니다.

| ID | 이름 | 무드 |
|----|------|------|
| `field` | Field | 아침 페어웨이 · 기본 |
| `studio` | Studio | 미니멀 에디토리얼 |
| `coral` | Ember | 앰버 포인트 |
| `dusk` | Dusk | 해질녘 딥 그린 |
| `fairway` | Fairway | 잔디 패턴 |
| `ink` | Ink | 잉크 블랙 |
| `meadow` | Meadow | 부드러운 낮 잔디 |
| `tournament` | Tournament | 대회 데이 하이에너지 |

**Customize**에서 다음을 세밀 조정합니다.

- 버튼 스타일: `solid` / `soft` / `outline` / `pill`
- 레이아웃: `stack` / `compact` / `cards`
- 폰트 페어: `editorial` / `sport` / `minimal` / `night`
- 배경: gradient · solid · pattern · image URL
- 강조색 · 텍스트색 · **커스텀 CSS** (위험한 구문은 서버에서 차단)

## SNS 채널

1. Admin → **Channel URL**에 YouTube / Instagram / X 등 주소 입력  
2. **Import channel info** → OG title / description / image 수집  
3. 공개 페이지에 채널 카드로 노출  

OAuth 없이 **공개 메타(oEmbed/OG)** 기반입니다.

## 공유 · 메일

- `showShare`: Share(Web Share API) · 링크 복사  
- `showContact` + `contactEmail`: Email CTA (`mailto:`)

## 데이터베이스

주요 테이블:

- `users` — 계정  
- `pages` — handle, bio, theme, design(JSON), contact_email, 공유/메일 플래그  
- `links` — 버튼 링크  
- `social_channels` — SNS 메타 카드  

수동 SQL: `drizzle/0001_design_social.sql`  
일상 개발: `npm run db:push` / `db:generate` / `db:studio`

## MCP (Cursor 에이전트)

앱이 떠 있는 상태에서 에이전트가 페이지를 읽고 고칠 수 있습니다.

### Cursor 설정

`~/.cursor/mcp.json` 또는 프로젝트 `.cursor/mcp.json` 예시 (`mcp/mcp.json.example` 참고):

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

- `"type": "stdio"` **필수**  
- 설정 후 Cursor **완전 종료 → 재실행**  
- Settings → Tools & MCP 에서 `linkbio` 녹색 확인  

상세: [`mcp/README.md`](./mcp/README.md)

### 도구 목록

| 도구 | 역할 |
|------|------|
| `list_templates` | 템플릿·기본 디자인 목록 |
| `get_page` | 프로필·링크·SNS·디자인 요약 |
| `apply_template` | 템플릿 적용 |
| `update_design` | 배경/색/커스텀 CSS 패치 |
| `update_profile` | 표시명·바이오·메일·공개 플래그 |
| `import_social` | SNS URL 메타 가져오기 |
| `upsert_link` / `delete_link` | 링크 버튼 생성·수정·삭제 |

### HTTP로 직접 호출

```bash
curl -H "Authorization: Bearer $MCP_API_KEY" \
  "http://localhost:3000/api/v1/agent?action=templates"

curl -H "Authorization: Bearer $MCP_API_KEY" \
  "http://localhost:3000/api/v1/agent?action=page&handle=bolbanjang"
```

디자인 패치 예:

```json
{
  "action": "update_design",
  "handle": "bolbanjang",
  "design": {
    "accentColor": "#1a5c45",
    "customCss": ".public-shell { max-width: 420px; }"
  }
}
```

## npm 스크립트

| 스크립트 | 설명 |
|----------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` / `start` | 프로덕션 빌드·실행 |
| `npm run typecheck` / `lint` / `test` | 품질 검사 |
| `npm run db:push` | 스키마 반영 |
| `npm run db:generate` | 마이그레이션 생성 |
| `npm run db:studio` | Drizzle Studio |
| `npm run verify:db` | DB 스모크 (유니크·테넌시·SNS 등) |
| `npm run seed:golf` | 샘플 골프 프로필 |
| `npm run mcp` | MCP 서버 단독 실행 |

## Vercel 배포

`vercel.json` 빌드 커맨드:

```text
npm run db:push && npm run verify:db && npm run build
```

Vercel 환경 변수에 `DATABASE_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`, (선택) `MCP_API_KEY` / Upstash 를 넣습니다.

## 보안 메모

- 비밀번호: bcrypt cost **12**  
- 세션: HttpOnly · SameSite=Lax · (프로덕션) Secure  
- Server Action마다 인증·페이지 소유권 재확인  
- 외부 URL은 `http`/`https`만  
- 커스텀 CSS에서 `@import`, `expression()`, `javascript:` 등 차단  
- Rate limit: 기본 **메모리**. 운영은 `UPSTASH_REDIS_REST_*`  
- MCP API: Bearer `MCP_API_KEY` + 분당 호출 제한  

## 개발 현황

진행 체크리스트는 [`frontend.md`](./frontend.md), 작업 기록은 [`worklog.md`](./worklog.md) 를 참고하세요.

## 라이선스

Private (`contentscoin/linkbio`).
