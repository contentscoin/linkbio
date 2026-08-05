import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import {
  ExternalLink,
  Eye,
  EyeOff,
  Link2,
  LogOut,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { getDb } from "@/db";
import { links } from "@/db/schema";
import { Message } from "@/components/message";
import { logoutAction } from "@/app/login/actions";
import { requireCurrentUserPage } from "@/lib/current";
import { messageFromSearchParams } from "@/lib/messages";
import {
  createLinkAction,
  deleteLinkAction,
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
  const pageLinks = await getDb()
    .select()
    .from(links)
    .where(eq(links.pageId, current.page.id))
    .orderBy(asc(links.sortOrder), asc(links.createdAt));
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
        <div className="admin-grid">
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
              <textarea className="textarea" id="bio" name="bio" defaultValue={current.page.bio} maxLength={280} />
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
                <label htmlFor="theme">Theme</label>
                <select className="select" id="theme" name="theme" defaultValue={current.page.theme}>
                  <option value="field">Field</option>
                  <option value="studio">Studio</option>
                  <option value="coral">Coral</option>
                </select>
              </div>
            </div>
            <label className="checkbox-line inline-label">
              <input name="isPublished" type="checkbox" defaultChecked={current.page.isPublished} />
              Published
              {current.page.isPublished ? <Eye size={16} /> : <EyeOff size={16} />}
            </label>
            <button className="button primary" type="submit">
              <Save size={17} />
              Save profile
            </button>
          </form>

          <section className="stack">
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
