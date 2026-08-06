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
          <li>
            Bioomo는 무료입니다. MCP로 링크·문구를 수정하고 디자인까지 고도화할 수
            있습니다.
          </li>
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

      <section className="panel landing-process" aria-labelledby="process-title">
        <h2 id="process-title">이렇게 만듭니다</h2>
        <ol className="landing-steps">
          <li>
            <strong>무료로 가입</strong>
            <span>주소만 정하면 Bioomo 페이지가 바로 생깁니다.</span>
          </li>
          <li>
            <strong>MCP 연결</strong>
            <span>설정에서 Cursor·Claude 등에 Bioomo MCP를 붙입니다.</span>
          </li>
          <li>
            <strong>대화로 고도화</strong>
            <span>링크·카피·레이아웃·디자인을 MCP로 계속 다듬습니다.</span>
          </li>
        </ol>
      </section>

      <section className="panel landing-sample" aria-labelledby="sample-title">
        <h2 id="sample-title">실제 예시 · FMGS</h2>
        <p className="landing-sample-lede">
          골프 마케팅 브랜드 FMGS 페이지입니다. 상담 CTA, 핵심 서비스, 바로가기를
          Bioomo로 구성하고 MCP로 디자인을 맞춰 가는 과정의 샘플입니다.
        </p>
        <div className="landing-sample-frame">
          <iframe
            className="landing-sample-iframe"
            src="/fmg"
            title="FMGS Bioomo 샘플 미리보기"
            loading="lazy"
          />
        </div>
        <div className="landing-sample-meta">
          <span>
            골퍼 DB · 파트너 코스 · 대회 수치와 서비스 카드가 한 페이지에 모입니다.
          </span>
          <Link className="btn btn--primary" href="/fmg">
            샘플 페이지 보기
          </Link>
        </div>
      </section>

      <p className="foot">
        MCP 연결은 가입 후 설정에서 안내합니다. 샘플은{" "}
        <Link href="/fmg">/fmg</Link>에서 바로 확인할 수 있습니다.
      </p>

      <a
        className="omo-promo"
        href="https://omo.co.kr"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="omo-promo-brand">OMO</span>
        <span className="omo-promo-body">
          <strong>텔레그램 실무 비서, 월 10만원</strong>
          <span>
            Bioomo를 만든 오모(OMO) — 대화로 업무를 맡기는 AI 오퍼레이터를
            만나보세요.
          </span>
        </span>
        <span className="omo-promo-cta" aria-hidden="true">
          omo.co.kr →
        </span>
      </a>
    </main>
  );
}
