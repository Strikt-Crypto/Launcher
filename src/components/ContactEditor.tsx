"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Plus, Trash } from "@phosphor-icons/react";
import { socialLogo } from "../lib/brands";
import { tickerOf } from "../lib/format";
import { PROJECT_STATUSES, SOCIAL_NAMES } from "../lib/labels";
import { uid } from "../lib/id";
import { initials, readLogo } from "../lib/logo";
import { useStore } from "../store";
import type { Contact, ContactLink } from "../types";
import { Confirm, Field, Modal } from "./ui";

function ContactFrame({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  return <Modal open={open} title={title} kicker="Contacts" wide onClose={onClose}>{children}</Modal>;
}

function blankContact(): Contact {
  return { id: "", name: "", title: "", phone: "", email: "", company: "", note: "", image: "", links: [] };
}

export function ContactEditor({ open, initial, onClose, onSaved, page }: { open: boolean; initial: Contact | null; onClose: () => void; onSaved?: (contact: Contact) => void; page?: boolean }) {
  const store = useStore();
  const [draft, setDraft] = useState<Contact>(blankContact);
  const [error, setError] = useState("");
  const [pick, setPick] = useState(false);
  const [query, setQuery] = useState("");
  const [leave, setLeave] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(initial ? { ...initial, links: initial.links.map((link) => ({ ...link })) } : blankContact());
    setError("");
  }, [open, initial]);

  const set = (patch: Partial<Contact>) => setDraft((current) => ({ ...current, ...patch }));

  const setLink = (id: string, patch: Partial<ContactLink>) => {
    setDraft((current) => ({
      ...current,
      links: current.links.map((link) => (link.id === id ? { ...link, ...patch } : link)),
    }));
  };

  const namedLink = (name: string) => draft.links.find((link) => link.name.toLowerCase() === name.toLowerCase());

  const writeNamed = (name: string, patch: Partial<ContactLink>) => {
    const existing = namedLink(name);
    if (existing) setLink(existing.id, patch);
    else set({ links: [...draft.links, { id: uid("lnk"), name, url: "", handle: "", ...patch }] });
  };

  const dropNamed = (name: string) => set({ links: draft.links.filter((link) => link.name.toLowerCase() !== name.toLowerCase()) });

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    const next: Contact = {
      ...draft,
      name: draft.name.trim(),
      title: draft.title.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      company: draft.company.trim(),
      note: draft.note.trim(),
      links: draft.links
        .filter((link) => link.name.trim() || link.url.trim() || link.handle.trim())
        .map((link) => ({
          ...link,
          name: link.name.trim() || "Link",
          url: link.url.trim(),
          handle: link.handle.trim(),
        })),
    };
    const saved = initial ? { ...next, id: initial.id } : { ...next, id: uid("con") };
    if (initial) store.updateContact(initial.id, saved);
    else store.addContact(saved);
    onSaved?.(saved);
    onClose();
  };

  const photo = (
    <label className={page ? "mark contact-shot" : "contact-shot"}>
      {draft.image ? <img src={draft.image} alt="" /> : <span>{initials(draft.name || "Contact")}</span>}
      <input
        type="file"
        accept="image/*"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          try {
            set({ image: await readLogo(file) });
            setError("");
          } catch {
            setError("That image could not be read.");
          }
        }}
      />
    </label>
  );

  const named = SOCIAL_NAMES.map((name) => ({ key: name, name, custom: false as const, link: namedLink(name) || null }));
  const extras = draft.links
    .filter((link) => !SOCIAL_NAMES.some((name) => name.toLowerCase() === link.name.toLowerCase()))
    .map((link) => ({ key: link.id, name: link.name, custom: true as const, link }));

  const onProjects = initial ? store.projects.filter((project) => (project.contactIds || []).includes(initial.id)) : [];
  const openProjects = initial ? store.projects.filter((project) => !(project.contactIds || []).includes(initial.id) && `${project.name} ${project.ticker}`.toLowerCase().includes(query.trim().toLowerCase())) : [];

  const socials = (
    <section className="card">
      <div className="spread">
        <h2>Socials</h2>
        <button type="button" className="btn btn-small" onClick={() => set({ links: [...draft.links, { id: uid("lnk"), name: "", url: "", handle: "" }] })}><Plus size={14} />Add</button>
      </div>
      <div className="line-fill">
        {[...named, ...extras].map((slot) => {
          const logo = socialLogo(slot.name);
          return (
            <div key={slot.key} className="list-row social-edit">
              <span className="token-logo sm">{logo ? <img src={logo} alt="" /> : initials(slot.name || "Link")}</span>
              {slot.custom ? (
                <input className="cell-input" value={slot.link.name} placeholder="Network" onChange={(event) => setLink(slot.link.id, { name: event.target.value })} />
              ) : (
                <span>{slot.name}</span>
              )}
              <input
                className="cell-input"
                value={slot.link?.handle || ""}
                placeholder="Handle"
                autoComplete="off"
                onChange={(event) => (slot.custom ? setLink(slot.link.id, { handle: event.target.value }) : writeNamed(slot.name, { handle: event.target.value }))}
              />
              <input
                className="cell-input"
                value={slot.link?.url || ""}
                placeholder="Link"
                autoComplete="off"
                onChange={(event) => (slot.custom ? setLink(slot.link.id, { url: event.target.value }) : writeNamed(slot.name, { url: event.target.value }))}
              />
              {slot.custom || slot.link ? (
                <button type="button" className="btn btn-small" onClick={() => (slot.custom ? set({ links: draft.links.filter((item) => item.id !== slot.link.id) }) : dropNamed(slot.name))}>Remove</button>
              ) : <span />}
            </div>
          );
        })}
      </div>
    </section>
  );

  const details = (
    <section className="card">
      <h2>Details</h2>
      <div className="detail-grid">
        <div>
          <span className="tiny">Number</span>
          <input className="cell-input" type="tel" value={draft.phone} placeholder="Number" autoComplete="off" onChange={(event) => set({ phone: event.target.value })} />
        </div>
        <div>
          <span className="tiny">Email</span>
          <input className="cell-input" type="email" value={draft.email} placeholder="Email" autoComplete="off" onChange={(event) => set({ email: event.target.value })} />
        </div>
        <div>
          <span className="tiny">Company</span>
          <input className="cell-input" value={draft.company} placeholder="Company" onChange={(event) => set({ company: event.target.value })} />
        </div>
        <div>
          <span className="tiny">Title</span>
          <input className="cell-input" value={draft.title} placeholder="Title" onChange={(event) => set({ title: event.target.value })} />
        </div>
      </div>
    </section>
  );

  const note = (
    <section className="card note-pad">
      <h2>Note</h2>
      <textarea className="note-field" value={draft.note} placeholder="Write a note" onChange={(event) => set({ note: event.target.value })} />
    </section>
  );

  if (page) {
    return (
      <>
      <form className="page screen" onSubmit={save}>
        <header className="card desk-head has-mark">
          {photo}
          <div className="kicker">{draft.title || "Contact"}{draft.company ? ` · ${draft.company}` : ""}</div>
          <input className="display name-field" value={draft.name} placeholder="Name" required autoFocus onChange={(event) => set({ name: event.target.value })} />
          {error ? <p className="lede">{error}</p> : null}
          <div className="desk-head-actions">
            {draft.image && <button type="button" className="btn" onClick={() => set({ image: "" })}>Remove photo</button>}
            <button className="btn btn-primary" type="submit">{initial ? "Save" : "Add contact"}</button>
          </div>
        </header>
        <div className="desk-fit">
          <div className="contact-board">
            {socials}
            {details}
            <section className="card">
              <div className="spread">
                <h2>Projects</h2>
                {initial && <button type="button" className="btn btn-small" onClick={() => { setQuery(""); setPick(true); }}><Plus size={14} />Add</button>}
              </div>
              <div className="line-fill">
                {!initial && <p className="muted line-empty">Save the contact before adding a project.</p>}
                {initial && onProjects.length === 0 && <p className="muted line-empty">Not on a project.</p>}
                {onProjects.map((project) => (
                  <div key={project.id} className="list-row quad">
                    <span className="token-logo sm">{project.logo ? <img src={project.logo} alt="" /> : initials(project.name)}</span>
                    <Link href={`/projects/${project.id}?tab=contacts`}>{project.name}</Link>
                    <span className="tiny">{tickerOf(project.ticker)} · {PROJECT_STATUSES.find((item) => item.id === project.status)?.label || project.status}</span>
                    <button type="button" className="btn btn-small" onClick={() => setLeave(project.id)}><Trash size={14} />Remove</button>
                  </div>
                ))}
              </div>
            </section>
            {note}
          </div>
        </div>
      </form>
      <Modal open={pick} title="Add to a project" kicker={draft.name || "Contact"} onClose={() => setPick(false)}>
        <div className="stack">
          <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects" />
          <div className="card-scroll stack" style={{ maxHeight: 320, flex: "none" }}>
            {openProjects.length === 0 && <p className="muted">Every project already has this person, or nothing matches.</p>}
            {openProjects.map((project) => (
              <button key={project.id} type="button" className="spread card pick-row" onClick={() => { if (initial) store.attachContact(project.id, initial.id); setPick(false); }}>
                <span>
                  <strong>{project.name}</strong>
                  <div className="muted">{project.ticker ? `$${project.ticker}` : "No ticker"} · {project.status}</div>
                </span>
                <span className="tiny">Add</span>
              </button>
            ))}
          </div>
        </div>
      </Modal>
      <Confirm
        open={leave != null}
        title="Take them off this project?"
        text="They stay in Contacts. Only that project loses them."
        onConfirm={() => { if (leave && initial) store.detachContact(leave, initial.id); setLeave(null); }}
        onClose={() => setLeave(null)}
      />
    </>
    );
  }

  return (
    <ContactFrame open={open} title={initial ? "Edit contact" : "New contact"} onClose={onClose}>
      <form className="stack" onSubmit={save}>
        <div className="contact-editor">
          {photo}
          <div className="stack">
            <div className="form-grid">
              <Field label="Name"><input className="input" value={draft.name} onChange={(e) => set({ name: e.target.value })} required autoFocus /></Field>
              <Field label="Title"><input className="input" value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder="Founder, BD, advisor" /></Field>
              <Field label="Number"><input className="input" type="tel" value={draft.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+1 555 0100" autoComplete="off" /></Field>
              <Field label="Email"><input className="input" type="email" value={draft.email} onChange={(e) => set({ email: e.target.value })} autoComplete="off" /></Field>
              <Field label="Company" className="span-2"><input className="input" value={draft.company} onChange={(e) => set({ company: e.target.value })} /></Field>
            </div>
            {draft.image && <button type="button" className="btn btn-small" onClick={() => set({ image: "" })}>Remove photo</button>}
            {error && <p className="muted">{error}</p>}
          </div>
        </div>
        <Field label="Note"><textarea className="textarea" value={draft.note} onChange={(e) => set({ note: e.target.value })} placeholder="How you know them, timezone, who introduced them" /></Field>
        <div className="stack">
          <div className="spread">
            <strong>Socials</strong>
            <button type="button" className="btn btn-small" onClick={() => set({ links: [...draft.links, { id: uid("lnk"), name: "X", url: "", handle: "" }] })}>Add social</button>
          </div>
          {draft.links.length === 0 && <p className="muted">No socials yet. Add X, Telegram, a site, or any other link.</p>}
          {draft.links.map((link) => (
            <div key={link.id} className="contact-link">
              <Field label="Network">
                <input className="input" list={`nets-${link.id}`} value={link.name} onChange={(e) => setLink(link.id, { name: e.target.value })} />
                <datalist id={`nets-${link.id}`}>
                  {SOCIAL_NAMES.map((name) => <option key={name} value={name} />)}
                </datalist>
              </Field>
              <Field label="Handle"><input className="input" value={link.handle} onChange={(e) => setLink(link.id, { handle: e.target.value })} placeholder="@name" autoComplete="off" /></Field>
              <Field label="Link"><input className="input" value={link.url} onChange={(e) => setLink(link.id, { url: e.target.value })} placeholder="https://" autoComplete="off" /></Field>
              <button type="button" className="btn btn-small" onClick={() => set({ links: draft.links.filter((item) => item.id !== link.id) })}>Remove</button>
            </div>
          ))}
        </div>
        <div className="spread">
          <span className="tiny">Photo stays in this browser with the rest of the records.</span>
          <button className="btn btn-primary" type="submit">{initial ? "Save contact" : "Add contact"}</button>
        </div>
      </form>
    </ContactFrame>
  );
}
