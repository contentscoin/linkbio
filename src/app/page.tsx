import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell">
      <div className="topbar">
        <span className="brand">
          <span className="brand-dot" aria-hidden="true" />
          OMO Bio
        </span>
        <Link className="btn" href="/login">
          로그인
        </Link>
      </div>

      <h1>프로필 링크는 하나뿐인데, 보낼 곳은 여러 개일 때</h1>
      <p className="lede">
        SNS 프로필에는 링크를 하나만 걸 수 있습니다. 그 하나에 상담, 주문, 소개,
        예약을 전부 모아두는 페이지를 만드세요. 주소는 직접 정하고, 내용은 언제든
        바꿀 수 있습니다.
      </p>

      <div className="panel">
        <h2>이런 게 됩니다</h2>
        <ul
          style={{
            margin: 0,
            paddingLeft: 20,
            color: "var(--ink-soft)",
            fontSize: 14.5,
          }}
        >
          <li>내가 정한 주소로 페이지가 생깁니다. 예: /bolbanjang</li>
          <li>
            버튼을 원하는 순서로 넣고, 그룹으로 묶고, 하나를 크게 강조할 수
            있습니다.
          </li>
          <li>
            모바일에서 먼저 보이게 만들었습니다. SNS 유입은 대부분 휴대폰입니다.
          </li>
          <li>공개 여부를 끄면 준비하는 동안 아무에게도 안 보입니다.</li>
        </ul>
      </div>

      <div className="row">
        <Link className="btn btn--primary" href="/signup">
          무료로 시작하기
        </Link>
        <Link className="btn" href="/login">
          이미 계정이 있어요
        </Link>
      </div>

      <p className="foot">
        만든 페이지 예시가 궁금하면 가입 후 편집기에서 바로 미리볼 수 있습니다.
      </p>
    </main>
  );
}
