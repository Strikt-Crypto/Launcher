"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowSquareOut, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { Confirm, Empty, Modal } from "../components/ui";
import { socialLogo } from "../lib/brands";
import { SOCIAL_NAMES } from "../lib/labels";
import { href, money, whatsappHref } from "../lib/format";
import { packageMark, serviceMark } from "../lib/marks";
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
  const packs = store.packages.filter((pack) => contact?.providerId && pack.providerId === contact.providerId);
  const offered = store.services.filter((service) => contact?.providerId && service.providerId === contact.providerId && service.kind === "service" && service.available);
  const onProjects = store.projects.filter((project) => contact && (project.contactIds || []).includes(contact.id));
  const openProjects = store.projects.filter((project) => contact && !(project.contactIds || []).includes(contact.id) && `${project.name} ${project.ticker}`.toLowerCase().includes(query.trim().toLowerCase()));
  if (!contact) {
    return (
      <div className="page">
        <Empty title="Contact missing" text="This person was removed." action={<Link href="/contacts" className="btn">Contacts</Link>} />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="card desk-head has-mark">
        <div className="mark contact-shot">
          {contact.image ? <img src={contact.image} alt="" /> : <span>{initials(contact.name)}</span>}
        </div>
        <div className="kicker">{contact.title || "Contact"}{contact.company ? ` · ${contact.company}` : ""}</div>
        <h1 className="display">{contact.name}</h1>
        <p className="lede">{contact.note || contact.phone || "Add a note, number, and the socials you use."}</p>
        <div className="desk-head-actions">
          <Link className="btn" href={`/contacts/${contact.id}/edit`}><PencilSimple size={16} />Edit</Link>
          <button type="button" className="btn btn-danger" onClick={() => setDrop(true)}><Trash size={16} />Remove</button>
        </div>
      </header>
      <div className="pack-facts contact-facts">
        <article>
          <span>Number</span>
          {whatsappHref(contact.phone) ? <a href={whatsappHref(contact.phone)} target="_blank" rel="noreferrer"><strong>{contact.phone}</strong></a> : <strong>—</strong>}
        </article>
        <article>
          <span>Email</span>
          {contact.email ? <a href={href(contact.email)}><strong>{contact.email}</strong></a> : <strong>—</strong>}
        </article>
        <article><span>Company</span><strong>{contact.company || "—"}</strong></article>
        <article><span>Title</span><strong>{contact.title || "—"}</strong></article>
      </div>

      <div className="pane-grid">
        <section className="card hold pad-services social-slots">
          <div className="spread">
            <h2>Socials</h2>
            <Link className="btn btn-small" href={`/contacts/${contact.id}/edit`}><Plus size={14} />Add social</Link>
          </div>
          <div className="card-scroll">
          <div className="contact-rows">
            {[
              ...SOCIAL_NAMES.filter((name) => contact.links.some((link) => link.name.toLowerCase() === name.toLowerCase())),
              ...contact.links.filter((link) => !SOCIAL_NAMES.some((name) => name.toLowerCase() === link.name.toLowerCase())).map((link) => link.name),
              ...SOCIAL_NAMES.filter((name) => !contact.links.some((link) => link.name.toLowerCase() === name.toLowerCase())),
            ].map((name) => {
              const link = contact.links.find((item) => item.name.toLowerCase() === name.toLowerCase());
              const url = href(link?.url || "");
              const logo = socialLogo(name);
              return (
                <div key={name} className={link ? "spread" : "spread placeholder"}>
                  <span className="contact-bit"><span className="token-logo sm">{logo ? <img src={logo} alt="" /> : initials(name)}</span><span><strong>{name}</strong><span className="tiny">{link ? (link.handle || link.url || "—") : "Not linked"}</span></span></span>
                  {url && <a className="btn btn-small" href={url} target="_blank" rel="noreferrer"><ArrowSquareOut size={14} />Open</a>}
                </div>
              );
            })}
          </div>
          </div>
        </section>
        <section className="card hold pad-services">
          <div className="spread">
            <h2>Projects</h2>
            <button type="button" className="btn btn-small" onClick={() => { setQuery(""); setPick(true); }}><Plus size={14} />Add to project</button>
          </div>
          <div className="card-scroll">
          {onProjects.length > 0 && (
          <div className="contact-rows">
            {onProjects.map((project) => (
              <div key={project.id} className="spread">
                <Link href={`/projects/${project.id}?tab=contacts`} className="contact-bit">
                  <span className="token-logo sm">{project.logo ? <img src={project.logo} alt="" /> : initials(project.name)}</span>
                  <span><strong>{project.name}</strong><span className="tiny">{project.ticker ? `$${project.ticker}` : "No ticker"} · {project.status}</span></span>
                </Link>
                <button type="button" className="btn btn-small" onClick={() => setLeave(project.id)}><Trash size={14} />Remove</button>
              </div>
            ))}
          </div>
          )}
          <div className="contact-rows slot-tail">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="spread placeholder">
                <span className="contact-bit"><span className="token-logo sm" /><span><strong>Project</strong><span className="tiny">Not on a project</span></span></span>
              </div>
            ))}
          </div>
          </div>
        </section>

      {(packs.length > 0 || offered.length > 0) && (
        <section className="card hold tall span-2">
          <div className="hold-head">
            <h2>What they bring</h2>
            <p className="tiny">Packages and services from this contact. Attach the person to a token, then add the ones that launch is using.</p>
          </div>
          <div className="card-scroll">
          <div className="project-grid">
            {packs.map((pack) => (
              <Link key={pack.id} href={`/packages/${pack.id}`} className="offer-card">
                <span className="token-logo">{packageMark(pack, store.platforms) ? <img src={packageMark(pack, store.platforms)} alt="" /> : "Pk"}</span>
                <span className="card-id"><strong>{pack.name}</strong><span className="tiny">Package</span></span>
                <span className="figure">{money(pack.price, pack.currency)}</span>
              </Link>
            ))}
            {offered.map((service) => (
              <Link key={service.id} href={`/catalog/${service.id}`} className="offer-card">
                <span className="token-logo">{serviceMark(service, store.platforms) ? <img src={serviceMark(service, store.platforms)} alt="" /> : initials(service.name)}</span>
                <span className="card-id"><strong>{service.name}</strong><span className="tiny">Service</span></span>
                <span className="figure">{service.tiers[0] ? money(service.tiers[0].price, service.tiers[0].currency) : "—"}</span>
              </Link>
            ))}
          </div>
          </div>
        </section>
      )}
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
