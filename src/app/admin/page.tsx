import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import {
  ExternalLink,
  Eye,
  EyeOff,
  Link2,
  LogOut,
  Palette,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { getDb } from "@/db";
import { links, socialChannels } from "@/db/schema";
import { Message } from "@/components/message";
import { PublicPreview } from "@/components/public-preview";
import { logoutAction } from "@/app/login/actions";
import { requireCurrentUserPage } from "@/lib/current";
import { messageFromSearchParams } from "@/lib/messages";
import { resolveDesign, TEMPLATE_IDS, templates } from "@/lib/templates";
import { platformLabel, type SocialPlatform } from "@/lib/social-platforms";
import {
  applyTemplateAction,
  createLinkAction,
  deleteLinkAction,
  deleteSocialAction,
  importSocialAction,
  updateDesignAction,
  updateLinkAction,
  updateProfileAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const current = await requireCurrentUserPage();
  const db = getDb();
  const pageLinks = await db
    .select()
    .from(links)
    .where(eq(links.pageId, current.page.id))
    .orderBy(asc(links.sortOrder), asc(links.createdAt));
  const channels = await db
    .select()
    .from(socialChannels)
    .where(eq(socialChannels.pageId, current.page.id))
    .orderBy(asc(socialChannels.sortOrder), asc(socialChannels.createdAt));
  const design = resolveDesign(current.page.theme, current.page.design);
  const message = messageFromSearchParams(await searchParams);

  return (
    <main>
      <header className="shell toolbar">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            <Link2 size={18} />
          </span>
          <span>LinkBio Admin</span>
        </Link>
        <div className="nav-actions">
          <Link className="button secondary" href={`/${current.page.handle}`} target="_blank">
            <ExternalLink size={17} />
            Public page
          </Link>
          <form action={logoutAction}>
            <button className="button secondary" type="submit">
              <LogOut size={17} />
              Logout
            </button>
          </form>
        </div>
      </header>

      <section className="shell stack">
        <Message message={message} />
        <div className="admin-preview-dock form-card">
          <div>
            <p className="eyebrow">Live preview</p>
            <h2>공개 페이지 미리보기</h2>
          </div>
          <PublicPreview
            avatarInitials={current.page.avatarInitials}
            bio={current.page.bio}
            channels={channels}
            contactEmail={current.page.contactEmail}
            design={design}
            displayName={current.page.displayName}
            handle={current.page.handle}
            links={pageLinks}
            showContact={current.page.showContact}
            showShare={current.page.showShare}
            theme={current.page.theme}
          />
        </div>
        <div className="admin-grid admin-grid-wide">
          <div className="stack">
            <form className="form-card" action={updateProfileAction}>
              <div>
                <p className="eyebrow">Profile</p>
                <h1 className="compact-title">Edit public page</h1>
              </div>
              <div className="split-fields">
                <div className="field">
                  <label htmlFor="displayName">Display name</label>
                  <input
                    className="input"
                    id="displayName"
                    name="displayName"
                    defaultValue={current.page.displayName}
                    maxLength={80}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="handle">Handle</label>
                  <input
                    className="input"
                    id="handle"
                    name="handle"
                    defaultValue={current.page.handle}
                    pattern="[a-z0-9_-]{3,32}"
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="bio">Bio</label>
                <textarea
                  className="textarea"
                  id="bio"
                  name="bio"
                  defaultValue={current.page.bio}
                  maxLength={280}
                />
              </div>
              <div className="split-fields">
                <div className="field">
                  <label htmlFor="avatarInitials">Initials</label>
                  <input
                    className="input"
                    id="avatarInitials"
                    name="avatarInitials"
                    defaultValue={current.page.avatarInitials}
                    maxLength={4}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="contactEmail">Contact email</label>
                  <input
                    className="input"
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    defaultValue={current.page.contactEmail}
                    placeholder="hello@example.com"
                  />
                </div>
              </div>
              <div className="button-row">
                <label className="checkbox-line inline-label">
                  <input name="isPublished" type="checkbox" defaultChecked={current.page.isPublished} />
                  Published
                  {current.page.isPublished ? <Eye size={16} /> : <EyeOff size={16} />}
                </label>
                <label className="checkbox-line inline-label">
                  <input name="showShare" type="checkbox" defaultChecked={current.page.showShare} />
                  Share actions
                </label>
                <label className="checkbox-line inline-label">
                  <input name="showContact" type="checkbox" defaultChecked={current.page.showContact} />
                  Email CTA
                </label>
              </div>
              <button className="button primary" type="submit">
                <Save size={17} />
                Save profile
              </button>
            </form>

            <form className="form-card" action={applyTemplateAction}>
              <div>
                <p className="eyebrow">
                  <Sparkles size={14} /> Templates
                </p>
                <h2>Pick a public look</h2>
                <p className="small muted">템플릿을 적용하면 배경·버튼·폰트 기본값이 맞춰집니다.</p>
              </div>
              <div className="template-grid">
                {TEMPLATE_IDS.map((id) => {
                  const template = templates[id];
                  return (
                    <label className="template-card" key={id}>
                      <input
                        defaultChecked={current.page.theme === id}
                        name="theme"
                        type="radio"
                        value={id}
                      />
                      <span
                        className="template-swatch"
                        style={{
                          background: `linear-gradient(145deg, ${template.preview.sky}, ${template.preview.turf})`,
                        }}
                      />
                      <strong>{template.name}</strong>
                      <em>{template.description}</em>
                    </label>
                  );
                })}
              </div>
              <button className="button primary" type="submit">
                Apply template
              </button>
            </form>

            <form className="form-card" action={updateDesignAction}>
              <div>
                <p className="eyebrow">
                  <Palette size={14} /> Customize
                </p>
                <h2>꾸미기</h2>
              </div>
              <div className="split-fields">
                <div className="field">
                  <label htmlFor="buttonStyle">Button style</label>
                  <select className="select" id="buttonStyle" name="buttonStyle" defaultValue={design.buttonStyle}>
                    <option value="solid">Solid</option>
                    <option value="soft">Soft</option>
                    <option value="outline">Outline</option>
                    <option value="pill">Pill</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="layout">Layout</label>
                  <select className="select" id="layout" name="layout" defaultValue={design.layout}>
                    <option value="stack">Stack</option>
                    <option value="compact">Compact</option>
                    <option value="cards">Cards</option>
                  </select>
                </div>
              </div>
              <div className="split-fields">
                <div className="field">
                  <label htmlFor="fontPair">Font pair</label>
                  <select className="select" id="fontPair" name="fontPair" defaultValue={design.fontPair}>
                    <option value="editorial">Editorial</option>
                    <option value="sport">Sport</option>
                    <option value="minimal">Minimal</option>
                    <option value="night">Night</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="backgroundKind">Background</label>
                  <select
                    className="select"
                    id="backgroundKind"
                    name="backgroundKind"
                    defaultValue={design.backgroundKind}
                  >
                    <option value="gradient">Gradient</option>
                    <option value="solid">Solid</option>
                    <option value="pattern">Pattern</option>
                    <option value="image">Image URL</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="backgroundValue">Background value</label>
                <textarea
                  className="textarea"
                  id="backgroundValue"
                  name="backgroundValue"
                  defaultValue={design.backgroundValue}
                  required
                />
              </div>
              <div className="split-fields">
                <div className="field">
                  <label htmlFor="accentColor">Accent</label>
                  <input className="input" id="accentColor" name="accentColor" defaultValue={design.accentColor} required />
                </div>
                <div className="field">
                  <label htmlFor="textColor">Text</label>
                  <input className="input" id="textColor" name="textColor" defaultValue={design.textColor} required />
                </div>
              </div>
              <div className="field">
                <label htmlFor="mutedColor">Muted text</label>
                <input className="input" id="mutedColor" name="mutedColor" defaultValue={design.mutedColor} required />
              </div>
              <div className="field">
                <label htmlFor="customCss">Custom CSS (agent / advanced)</label>
                <textarea
                  className="textarea codey"
                  id="customCss"
                  name="customCss"
                  defaultValue={design.customCss}
                  placeholder={".public-shell { ... }"}
                />
              </div>
              <button className="button primary" type="submit">
                <Save size={17} />
                Save design
              </button>
            </form>
          </div>

          <section className="stack">
            <form className="form-card" action={importSocialAction}>
              <div>
                <p className="eyebrow">SNS channels</p>
                <h2>Connect & import</h2>
                <p className="small muted">
                  YouTube / Instagram / X 등 URL을 넣으면 OG·공개 메타를 가져와 카드로 붙입니다.
                </p>
              </div>
              <div className="field">
                <label htmlFor="socialUrl">Channel URL</label>
                <input
                  className="input"
                  id="socialUrl"
                  name="url"
                  type="url"
                  placeholder="https://www.youtube.com/@..."
                  required
                />
              </div>
              <button className="button primary" type="submit">
                <Plus size={17} />
                Import channel info
              </button>
            </form>

            <div className="stack">
              {channels.length === 0 ? (
                <div className="empty">
                  <h3>No channels yet</h3>
                  <p>SNS URL을 연결하면 대표 정보가 공개 페이지에 표시됩니다.</p>
                </div>
              ) : (
                channels.map((channel) => (
                  <div className="link-editor" key={channel.id}>
                    <div className="social-admin-row">
                      {channel.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt="" className="social-thumb" height={44} src={channel.imageUrl} width={44} />
                      ) : null}
                      <div>
                        <strong>
                          {platformLabel(channel.platform as SocialPlatform)} · {channel.title}
                        </strong>
                        <p className="small muted">{channel.url}</p>
                      </div>
                    </div>
                    <form action={deleteSocialAction}>
                      <input name="channelId" type="hidden" value={channel.id} />
                      <button className="button danger" type="submit">
                        <Trash2 size={17} />
                        Remove
                      </button>
                    </form>
                  </div>
                ))
              )}
            </div>

            <form className="form-card" action={createLinkAction}>
              <div>
                <p className="eyebrow">Links</p>
                <h2>Add a link</h2>
              </div>
              <div className="split-fields">
                <div className="field">
                  <label htmlFor="label">Label</label>
                  <input className="input" id="label" name="label" maxLength={80} required />
                </div>
                <div className="field">
                  <label htmlFor="url">URL</label>
                  <input className="input" id="url" name="url" type="url" placeholder="https://" required />
                </div>
              </div>
              <button className="button primary" type="submit">
                <Plus size={17} />
                Add link
              </button>
            </form>

            <div className="stack">
              {pageLinks.length === 0 ? (
                <div className="empty">
                  <h3>No links yet</h3>
                  <p>Add the first button for the public page.</p>
                </div>
              ) : (
                pageLinks.map((link) => (
                  <form className="link-editor" action={updateLinkAction} key={link.id}>
                    <input name="linkId" type="hidden" value={link.id} />
                    <div className="split-fields">
                      <div className="field">
                        <label htmlFor={`label-${link.id}`}>Label</label>
                        <input
                          className="input"
                          id={`label-${link.id}`}
                          name="label"
                          defaultValue={link.label}
                          maxLength={80}
                          required
                        />
                      </div>
                      <div className="field">
                        <label htmlFor={`sort-${link.id}`}>Order</label>
                        <input
                          className="input"
                          id={`sort-${link.id}`}
                          name="sortOrder"
                          type="number"
                          min={0}
                          max={999}
                          defaultValue={link.sortOrder}
                          required
                        />
                      </div>
                    </div>
                    <div className="field">
                      <label htmlFor={`url-${link.id}`}>URL</label>
                      <input
                        className="input"
                        id={`url-${link.id}`}
                        name="url"
                        type="url"
                        defaultValue={link.url}
                        required
                      />
                    </div>
                    <div className="button-row">
                      <label className="checkbox-line inline-label">
                        <input name="isVisible" type="checkbox" defaultChecked={link.isVisible} />
                        Visible
                      </label>
                      <button className="button secondary" type="submit">
                        <Save size={17} />
                        Save
                      </button>
                      <button className="button danger" type="submit" formAction={deleteLinkAction}>
                        <Trash2 size={17} />
                        Delete
                      </button>
                    </div>
                  </form>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
