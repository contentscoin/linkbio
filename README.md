# OMO Bio (linkbio)

멀티테넌트 링크인바이오. 계정마다 공개 페이지 `/{handle}`.

## 스택

- Next.js 16 · React 19.2.8 · Zod 4 · Drizzle · Neon Postgres · jose

## 로컬

```bash
cp .env.example .env.local
npm install
npm run dev
```

## 라우트

| 경로 | 설명 |
|------|------|
| `/` | 랜딩 |
| `/signup` | 가입 |
| `/login` | 로그인 |
| `/settings` | 계정 · MCP 연결 (API URL + 개인 토큰) |
| `/mypage` | `/settings`로 리다이렉트 |
| `/admin` | 편집기 |
| `/{handle}` | 공개 페이지 |
| `/api/v1/agent` | Agent / MCP HTTP API |

## MCP

로그인 후 `/settings`에서 개인 토큰을 발급하고 Cursor `mcp.json`에 붙여넣습니다. 자세한 내용은 [`mcp/README.md`](mcp/README.md).

## 주의

프로덕션 `bio.omo.co.kr` 는 Vercel에서 프로모트된 OMO Bio 배포가 기준입니다.
Git `main` 자동 배포가 켜져 있으면 머지 전에 반드시 미리보기로 대조하세요.
