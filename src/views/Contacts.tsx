"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react";
import { Empty, PageHead, Pill, Select, Tabs, ViewSwitch } from "../components/ui";
import { SocialMark, hasSocialMark } from "../components/SocialMark";
import { initials } from "../lib/logo";
import { useStore } from "../store";

export function Contacts() {
  const store = useStore();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "assigned" | "open">("all");
  const [company, setCompany] = useState("all");
  const [view, setView] = useState<"grid" | "table">("grid");
  const contacts = store.contacts || [];
  const assigned = (id: string) => store.projects.some((project) => (project.contactIds || []).includes(id));
  const companies = [...new Set(contacts.map((contact) => contact.company.trim()).filter(Boolean))].sort();
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...contacts].sort((a, b) => a.name.localeCompare(b.name)).filter((contact) => {
      const onProject = store.projects.some((project) => (project.contactIds || []).includes(contact.id));
      if (tab === "assigned" && !onProject) return false;
      if (tab === "open" && onProject) return false;
      if (company !== "all" && contact.company !== company) return false;
      const socials = contact.links.map((link) => `${link.name} ${link.handle} ${link.url}`).join(" ");
      return `${contact.name} ${contact.title} ${contact.phone} ${contact.email} ${contact.company} ${socials}`.toLowerCase().includes(q);
    });
  }, [contacts, query, tab, company, store.projects]);

  return (
    <div className="page screen">
      <PageHead
        kicker="People"
        title="Contacts"
        lede="Names, numbers, titles, and the socials you actually use."
      />
      <div className="tool-bar">
        <Tabs
          value={tab}
          onChange={(id) => setTab(id as "all" | "assigned" | "open")}
          tabs={[
            { id: "all", label: "All", count: contacts.length },
            { id: "assigned", label: "Assigned", count: contacts.filter((contact) => assigned(contact.id)).length },
            { id: "open", label: "Open", count: contacts.filter((contact) => !assigned(contact.id)).length },
          ]}
        />
        <div className="tool-end">
          <Select value={company} onChange={setCompany} options={[{ value: "all", label: "All companies" }, ...companies.map((name) => ({ value: name, label: name }))]} />
          <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" />
          <ViewSwitch value={view} onChange={setView} />
        </div>
      </div>
      <div className="desk-fit">
      {contacts.length === 0 && (
        <Empty title="No contacts yet" text="Add a person with a photo, number, title, and their social links." action={<Link href="/contacts/new" className="btn btn-primary"><Plus size={16} weight="bold" />Add contact</Link>} />
      )}
      {contacts.length > 0 && shown.length === 0 && <Empty title="No match" text="Try another name, title, or number." />}
      {view === "table" ? (
        <div className="table-wrap">
          <table className="blotter catalog">
            <thead><tr><th>Name</th><th>Title</th><th>Company</th><th>Email</th><th>Status</th></tr></thead>
            <tbody>
              {shown.map((contact) => (
                <tr key={contact.id}>
                  <td><Link className="name-link token-cell" href={`/contacts/${contact.id}`}><span className="token-logo sm">{contact.image ? <img src={contact.image} alt="" /> : initials(contact.name)}</span><span><strong>{contact.name}</strong></span></Link></td>
                  <td>{contact.title || "—"}</td>
                  <td>{contact.company || "—"}</td>
                  <td>{contact.email || "—"}</td>
                  <td><Pill>{assigned(contact.id) ? "Assigned" : "Open"}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
      <div className="project-grid">
        {shown.map((contact) => (
          <article key={contact.id} className="project-card contact-tile">
            <Link href={`/contacts/${contact.id}`} className="card-hit" aria-label={contact.name} />
            <div className="card-top">
              <span className="token-logo">{contact.image ? <img src={contact.image} alt="" /> : initials(contact.name)}</span>
              <div className="card-id">
                <strong>{contact.name}</strong>
                <div className="tiny">{contact.title || "No title"}{contact.company ? ` · ${contact.company}` : ""}</div>
              </div>
              <Pill>{assigned(contact.id) ? "Assigned" : "Open"}</Pill>
              {contact.links.some((link) => hasSocialMark(link.name)) && (
                <div className="chain-row contact-marks">{contact.links.map((link) => hasSocialMark(link.name) ? <SocialMark key={link.id} name={link.name} size={14} /> : null)}</div>
              )}
            </div>
            <div className="lane-grid">
              <div><span>Email</span><span className="num">{contact.email || "—"}</span></div>
              <div><span>Company</span><span className="num">{contact.company || "—"}</span></div>
              <div><span>Title</span><span className="num">{contact.title || "—"}</span></div>
              <div><span>Socials</span><span className="num">{contact.links.length}</span></div>
            </div>
          </article>
        ))}
      </div>
      )}
      </div>
    </div>
  );
}
