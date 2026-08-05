import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell">
      <div className="topbar">
        <Link className="brand" href="/">
          <span className="brand-dot" aria-hidden="true" />
          OMO Bio
        </Link>
      </div>
      <h1>이 주소에는 페이지가 없습니다</h1>
      <p className="lede">
        주소가 바뀌었거나, 아직 공개되지 않은 페이지일 수 있습니다.
      </p>
      <div className="row">
        <Link className="btn btn--primary" href="/">
          처음으로
        </Link>
        <Link className="btn" href="/signup">
          이 주소로 내 페이지 만들기
        </Link>
      </div>
    </main>
  );
}
