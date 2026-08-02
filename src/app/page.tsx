import Link from "next/link";
import { ArrowRight, Bot, ExternalLink, Palette, Share2 } from "lucide-react";
import { SiteNav } from "@/components/site-nav";

export default function Home() {
  return (
    <main>
      <SiteNav />
      <section className="shell hero">
        <div className="hero-copy">
          <p className="eyebrow">LinkBio · editorial field</p>
          <h1>LinkBio</h1>
          <p className="lead">
            한 장의 공개 페이지에 템플릿·꾸미기·SNS 요약·공유·메일을 모으고,
            MCP로 조회·정리·디자인 개인화까지 이어집니다.
          </p>
          <div className="button-row">
            <Link className="button primary" href="/signup">
              Create your page
              <ArrowRight size={17} />
            </Link>
            <Link className="button secondary" href="/login">
              Open admin
            </Link>
          </div>
        </div>

        <div className="preview-phone" aria-label="LinkBio preview">
          <div className="preview-screen">
            <div className="avatar">GL</div>
            <div>
              <h2>Golf Luckyball</h2>
              <p>Lesson packages, orders, and member links in one place.</p>
            </div>
            <div className="share-bar">
              <span className="action-chip">
                <Share2 size={16} />
                Share
              </span>
              <span className="action-chip">Email</span>
            </div>
            <div className="link-list">
              {["Lesson packages", "Kakao consultation", "Luckyball order"].map((label) => (
                <span className="bio-link" key={label}>
                  {label}
                  <ExternalLink size={16} />
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="shell feature-grid">
          <article className="card">
            <Palette size={22} />
            <h3>Templates & decorate</h3>
            <p>Field·Dusk·Tournament 등 8개 템플릿과 배경·버튼·커스텀 CSS 꾸미기.</p>
          </article>
          <article className="card">
            <Share2 size={22} />
            <h3>Share · mail · SNS</h3>
            <p>공유/복사, 메일 CTA, SNS URL 메타 가져와 채널 카드로 연결.</p>
          </article>
          <article className="card">
            <Bot size={22} />
            <h3>MCP agent API</h3>
            <p>페이지 조회·템플릿 적용·디자인 패치·링크/채널 수정을 에이전트가 제어.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
