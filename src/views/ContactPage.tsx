"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowSquareOut, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { Confirm, CopyIcon, Empty, Modal } from "../components/ui";
import { SocialMark } from "../components/SocialMark";
import { href, tickerOf, whatsappHref } from "../lib/format";
import { PROJECT_STATUSES, SOCIAL_NAMES } from "../lib/labels";
import { initials } from "../lib/logo";
import { useStore } from "../store";

export function ContactPage() {
  const { id } = useParams();
  const router = useRouter();
  const store = useStore();
  const contact = (store.contacts || []).find((item) => item.id === id);
  const [drop, setDrop] = useState(false);
  const [pick, setPick] = useState(false);
  const [query, setQuery] = useState("");
  const [leave, setLeave] = useState<string | null>(null);
  const onProjects = store.projects.filter((project) => contact && (project.contactIds || []).includes(contact.id));
  const openProjects = store.projects.filter((project) => contact && !(project.contactIds || []).includes(contact.id) && `${project.name} ${project.ticker}`.toLowerCase().includes(query.trim().toLowerCase()));
  const named = contact ? SOCIAL_NAMES.map((name) => ({ key: name, name, link: contact.links.find((item) => item.name.toLowerCase() === name.toLowerCase()) })) : [];
  const extra = contact ? contact.links.filter((link) => !SOCIAL_NAMES.some((name) => name.toLowerCase() === link.name.toLowerCase())).map((link) => ({ key: link.id, name: link.name, link })) : [];
  const slots = [...named.filter((slot) => slot.link), ...extra, ...named.filter((slot) => !slot.link)];
  if (!contact) {
    return (
      <div className="page">
        <Empty title="Contact missing" text="This person was removed." action={<Link href="/contacts" className="btn">Contacts</Link>} />
      </div>
    );
  }

  return (
    <div className="page screen">
      <header className="card desk-head has-mark">
        <div className="mark contact-shot">
          {contact.image ? <img src={contact.image} alt="" /> : <span>{initials(contact.name)}</span>}
        </div>
        <div className="kicker">{contact.title || "Contact"}{contact.company ? ` · ${contact.company}` : ""}</div>
        <h1 className="display copy-line"><span>{contact.name}</span><CopyIcon text={contact.name} /></h1>
        <div className="desk-head-actions">
          <Link className="btn" href={`/contacts/${contact.id}/edit`}><PencilSimple size={16} />Edit</Link>
          <button type="button" className="btn btn-danger" onClick={() => setDrop(true)}><Trash size={16} />Remove</button>
        </div>
      </header>

      <div className="desk-fit">
        <div className="contact-board">
          <section className="card">
            <div className="spread">
              <h2>Socials</h2>
              <Link className="btn btn-small" href={`/contacts/${contact.id}/edit`}><Plus size={14} />Add</Link>
            </div>
            <div className="line-fill">
              {slots.map((slot) => {
                const url = href(slot.link?.url || "");
                const value = slot.link ? (slot.link.handle || slot.link.url || "") : "";
                const cells = (
                  <>
                    <span className="token-logo sm"><SocialMark name={slot.name} /></span>
                    <span>{slot.name}</span>
                    {value ? <span className="copy-line"><span>{value}</span><CopyIcon text={value} /></span> : <span className="text-set">Not linked</span>}
                    {url ? <a className="btn btn-small" href={url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}><ArrowSquareOut size={14} />Open</a> : <span />}
                  </>
                );
                return slot.link ? (
                  <div key={slot.key} className="list-row quad">{cells}</div>
                ) : (
                  <Link key={slot.key} href={`/contacts/${contact.id}/edit`} className="list-row quad">{cells}</Link>
                );
              })}
            </div>
          </section>

          <section className="card">
            <h2>Details</h2>
            <div className="detail-grid">
              <div>
                <span className="tiny">Number</span>
                {whatsappHref(contact.phone) ? <span className="copy-line"><a href={whatsappHref(contact.phone)} target="_blank" rel="noreferrer">{contact.phone}</a><CopyIcon text={contact.phone} /></span> : <Link className="text-set" href={`/contacts/${contact.id}/edit`}>Not set</Link>}
              </div>
              <div>
                <span className="tiny">Email</span>
                {contact.email ? <span className="copy-line"><a href={href(contact.email)}>{contact.email}</a><CopyIcon text={contact.email} /></span> : <Link className="text-set" href={`/contacts/${contact.id}/edit`}>Not set</Link>}
              </div>
              <div>
                <span className="tiny">Company</span>
                <strong>{contact.company || "—"}</strong>
              </div>
              <div>
                <span className="tiny">Title</span>
                <strong>{contact.title || "—"}</strong>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="spread">
              <h2>Projects</h2>
              <button type="button" className="btn btn-small" onClick={() => { setQuery(""); setPick(true); }}><Plus size={14} />Add</button>
            </div>
            <div className="line-fill">
              {onProjects.length === 0 && <p className="muted line-empty">Not on a project.</p>}
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

          <section className="card note-pad">
            <h2>Note</h2>
            <textarea
              className="note-field"
              value={contact.note}
              placeholder="Write a note"
              onChange={(event) => store.updateContact(contact.id, { note: event.target.value })}
            />
          </section>
        </div>
      </div>

      <Modal open={pick} title="Add to a project" kicker={contact.name} onClose={() => setPick(false)}>
        <div className="stack">
          <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects" />
          <div className="card-scroll stack" style={{ maxHeight: 320, flex: "none" }}>
          {openProjects.length === 0 && <p className="muted">Every project already has this person, or nothing matches.</p>}
          {openProjects.map((project) => (
            <button key={project.id} type="button" className="spread card pick-row" onClick={() => { store.attachContact(project.id, contact.id); setPick(false); }}>
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
        onConfirm={() => { if (leave) store.detachContact(leave, contact.id); setLeave(null); }}
        onClose={() => setLeave(null)}
      />

      <Confirm
        open={drop}
        title={`Remove ${contact.name}?`}
        text="This takes the person off the list and off every project. The photo and links go with them."
        onConfirm={() => {
          store.deleteContact(contact.id);
          router.push("/contacts");
        }}
        onClose={() => setDrop(false)}
      />
    </div>
  );
}
