"use client";

import { useEffect, useState } from "react";
import { SOCIAL_NAMES } from "../lib/labels";
import { uid } from "../lib/id";
import { initials, readLogo } from "../lib/logo";
import { useStore } from "../store";
import type { Contact, ContactLink } from "../types";
import { Field, Modal } from "./ui";

function ContactFrame({ page, open, title, onClose, children }: { page?: boolean; open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  if (page) {
    return (
      <div className="page">
        <div className="topbar">
          <button type="button" className="btn btn-small" onClick={onClose}>Back</button>
          <div className="crumb">Contacts</div>
        </div>
        <header className="page-head"><h1>{title}</h1></header>
        <div className="card record-form">{children}</div>
      </div>
    );
  }
  return <Modal open={open} title={title} kicker="Contacts" wide onClose={onClose}>{children}</Modal>;
}

function blankContact(): Contact {
  return { id: "", name: "", title: "", phone: "", email: "", company: "", note: "", image: "", links: [] };
}

export function ContactEditor({ open, initial, onClose, onSaved, page }: { open: boolean; initial: Contact | null; onClose: () => void; onSaved?: (contact: Contact) => void; page?: boolean }) {
  const store = useStore();
  const [draft, setDraft] = useState<Contact>(blankContact);
  const [error, setError] = useState("");

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

  return (
    <ContactFrame page={page} open={open} title={initial ? "Edit contact" : "New contact"} onClose={onClose}>
      <form
        className="stack"
        onSubmit={(event) => {
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
        }}
      >
        <div className="contact-editor">
          <label className="contact-shot">
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
            <button
              type="button"
              className="btn btn-small"
              onClick={() => set({ links: [...draft.links, { id: uid("lnk"), name: "X", url: "", handle: "" }] })}
            >
              Add social
            </button>
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
