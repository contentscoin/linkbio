import { NextRequest, NextResponse } from "next/server";

/** Custom domains that must NOT serve this LinkBio Vercel project. */
const DETACHED_HOSTS = new Set(["bio.omo.co.kr", "www.bio.omo.co.kr"]);

const DETACH_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>도메인 연결 해제</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center;
      font-family: "Pretendard", "Apple SD Gothic Neo", sans-serif;
      background: #0b1728; color: #edf3fb; }
    main { max-width: 28rem; padding: 2rem; text-align: center; }
    h1 { font-size: 1.35rem; letter-spacing: -0.03em; margin: 0 0 0.75rem; }
    p { margin: 0; color: #93a8c4; line-height: 1.65; font-size: 0.95rem; }
    code { color: #60a5fa; font-size: 0.85rem; }
  </style>
</head>
<body>
  <main>
    <h1>이 도메인은 LinkBio 배포에서 분리되었습니다</h1>
    <p>
      <code>bio.omo.co.kr</code> 는 이 프로젝트(LinkBio)가 아닙니다.
      Vercel 프로젝트에서 커스텀 도메인을 제거한 뒤, 원래 OMO Bio 배포로 되돌리세요.
      MCP·설정은 LinkBio 전용 배포 URL에서 사용합니다.
    </p>
  </main>
</body>
</html>`;

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (DETACHED_HOSTS.has(host)) {
    return new NextResponse(DETACH_HTML, {
      status: 404,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
