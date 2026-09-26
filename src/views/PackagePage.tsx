"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Check, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { Confirm, Empty } from "../components/ui";
import { byId, href, money, whatsappHref } from "../lib/format";
import { initials } from "../lib/logo";
import { outletMark, packageMark } from "../lib/marks";
import { socialLogo } from "../lib/brands";
import { useStore } from "../store";
import { useUi } from "../ui";
import type { Contact, Outlet } from "../types";

export function PackagePage() {
  const { id } = useParams();
  const store = useStore();
  const ui = useUi();
  const router = useRouter();
  const pack = store.packages.find((item) => item.id === id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pickedId, setPickedId] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  if (pack && pickedId !== pack.id) {
    setPickedId(pack.id);
    setPicked([]);
  }
  if (!pack) return <div className="page"><Empty title="Package missing" text="It was removed." action={<Link href="/packages" className="btn">Packages</Link>} /></div>;
  const provider = byId(store.providers, pack.providerId);
  const logo = packageMark(pack, store.platforms);
  const people = store.contacts.filter((item) => item.providerId === pack.providerId);
  const contact = people[0];
  const callers = pack.outlets.some((item) => item.group);
  const deck = pack.includes.find((item) => item.url);
  const scope = pack.includes.filter((item) => !item.url);
  const kind = pack.group === "pr" ? "Article PR" : pack.id === "artem-tier-1" ? "Tier 1" : pack.group === "bundle" ? "Bundle" : "Budget";
  const chosen = pack.outlets.filter((item) => picked.includes(item.name));
  const callerSum = chosen.reduce((sum, item) => sum + (item.price || 0), 0);
  function toggleCaller(name: string) {
    setPicked((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));
  }

  return (
    <div className="page screen">
      <header className="card desk-head has-mark">
        <span className="mark token-logo lg">{logo ? <img src={logo} alt="" /> : initials(pack.group === "pr" ? "Article PR" : pack.name)}</span>
        <div className="desk-copy">
          <div className="kicker">{kind}{provider ? <> · <Link href={`/providers/${provider.id}`}>{provider.name}</Link></> : ""}</div>
          <h1 className="display">{pack.name}</h1>
        </div>
        <div className="desk-figure">
          <div className="tiny">{callerSum ? "Package + callers" : "Price"}</div>
          <div className="figure">{money(pack.price + callerSum, pack.currency)}</div>
          {callerSum ? <div className="tiny">{money(pack.price, pack.currency)} + {money(callerSum, pack.currency)}</div> : null}
        </div>
        <div className="desk-head-actions">
          <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)}><Trash size={16} />Delete</button>
          <Link className="btn" href={`/packages/${pack.id}/edit`}><PencilSimple size={16} />Edit</Link>
          <button type="button" className="btn btn-primary" onClick={() => ui.openAdd({ packageId: pack.id, callers: picked })}><Plus size={16} weight="bold" />Add to project</button>
        </div>
      </header>
      <div className="desk-fit">
        <div className="offer-board four">
          <section className="card">
            <div className="card-label">
              <h2>Price</h2>
              {deck?.url ? <a href={href(deck.url)} target="_blank" rel="noreferrer">Deck</a> : null}
            </div>
            <div className="price-grid">
              <div className="stat"><span className="stat-top"><span className="tiny">Amount</span></span><b>{money(pack.price, pack.currency)}</b></div>
              {callers ? scope.map((item) => (
                <div key={item.label} className="stat"><span className="stat-top"><span className="tiny">{item.label}</span></span><b>{item.note || "—"}</b></div>
              )) : (
                <>
                  <div className="stat"><span className="stat-top"><span className="tiny">Kind</span></span><b>{kind}</b></div>
                  <div className="stat"><span className="stat-top"><span className="tiny">Reach</span></span><b>{pack.guarantees[0] || "—"}</b></div>
                  <div className="stat"><span className="stat-top"><span className="tiny">Included</span></span><b>{pack.guarantees[1] || pack.extras[0] || "—"}</b></div>
                </>
              )}
            </div>
          </section>
          <section className="card">
            <h2>{callers ? "Callers" : "Sites"}</h2>
            <div className="stat geo-lead">
              <span className="stat-top"><span className="tiny">{callers ? (picked.length ? "Selected" : "Roster") : "Named"}</span>{callers ? <span className="tiny">{picked.length ? `${picked.length} of ${pack.outlets.length}` : "Select one or more"}</span> : null}</span>
              <b>{callers && picked.length ? money(callerSum, pack.currency) : pack.outlets.length}</b>
            </div>
            <div className="line-fill">
              {callers ? <CallerList outlets={pack.outlets} picked={picked} onToggle={toggleCaller} /> : (
                <>
                  {pack.extras.map((text) => (
                    <div key={text} className="list-row site"><span className="token-logo sm">{initials(text)}</span><span>{text}</span></div>
                  ))}
                  {pack.outlets.map((item) => {
                    const icon = outletMark(item.name, item.url, store.platforms);
                    const url = href(item.url || "");
                    const inner = (<><span className="token-logo sm">{icon ? <img src={icon} alt="" /> : initials(item.name)}</span><span>{item.name}</span></>);
                    return url ? <a key={item.name} className="list-row site" href={url} target="_blank" rel="noreferrer">{inner}</a> : <div key={item.name} className="list-row site">{inner}</div>;
                  })}
                </>
              )}
            </div>
          </section>
          <section className="card">
            <h2>Details</h2>
            {contact ? <PackageContact contact={contact} /> : null}
          </section>
          <section className="card note-pad">
            <h2>Note</h2>
            <textarea className="note-field" value={pack.notes || ""} placeholder="Write a note" onChange={(event) => store.updatePackage(pack.id, { notes: event.target.value })} />
          </section>
        </div>
      </div>
      <Confirm open={confirmDelete} title={`Delete ${pack.name}?`} text="Projects that already copied this package keep their rows." confirm="Delete" onConfirm={() => { store.deletePackage(pack.id); router.push("/packages"); }} onClose={() => setConfirmDelete(false)} />
    </div>
  );
}

function CallerList({ outlets, picked, onToggle }: { outlets: Outlet[]; picked: string[]; onToggle: (name: string) => void }) {
  const groups = [...new Set(outlets.map((item) => item.group).filter(Boolean))] as string[];
  return (
    <>
      {groups.map((group) => (
        <div key={group} className="caller-group">
          <div className="line-band"><b>{group}</b>{group === "Mainly fomo buyers" ? <span className="tiny">Posts can be discussed</span> : <span className="tiny">A range books the top price</span>}</div>
          {outlets.filter((item) => item.group === group).map((item) => {
            const on = picked.includes(item.name);
            const primary = item.url || "";
            const extra = (item.links || []).filter((link) => link.url !== primary);
            return (
              <div key={item.name} className={on ? "list-row caller on" : "list-row caller"} onClick={() => onToggle(item.name)}>
                <span className="token-logo sm">{initials(item.name.replace(/^@/, ""))}</span>
                {primary ? <a href={href(primary)} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>{item.name}</a> : <span>{item.name}</span>}
                <span>{item.note || "FOMO buy"}{extra.map((link) => <a key={link.url} href={href(link.url)} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>{link.label}</a>)}</span>
                <b className="num">{money(item.price || 0, "USD")}</b>
                {on ? <Check size={16} weight="bold" /> : <span />}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

function PackageContact({ contact }: { contact: Contact }) {
  const [photoOff, setPhotoOff] = useState(false);
  const reach = [
    contact.phone ? { label: "Number", value: contact.phone, href: whatsappHref(contact.phone) } : null,
    contact.email ? { label: "Email", value: contact.email, href: href(contact.email) } : null,
  ].filter((item): item is { label: string; value: string; href: string } => Boolean(item));
  const role = [contact.title, contact.company].filter(Boolean).join(" · ");
  return (
    <div className="who-board">
      <Link href={`/contacts/${contact.id}`} className="who-lead">
        <span className="token-logo">{contact.image && !photoOff ? <img src={contact.image} alt="" onError={() => setPhotoOff(true)} /> : initials(contact.name)}</span>
        <span className="line-copy">
          <b>{contact.name}</b>
          {role ? <span className="tiny">{role}</span> : null}
        </span>
      </Link>
      {reach.length > 0 && (
        <div className="req-pair">
          <span className="tiny">Reach</span>
          {reach.map((item) => (
            <a key={item.label} className="stat nest" href={item.href} target="_blank" rel="noreferrer">
              <span className="stat-top"><span className="tiny">{item.label}</span></span>
              <b>{item.value}</b>
            </a>
          ))}
        </div>
      )}
      {contact.links.length > 0 && (
        <div className="req-pair">
          <span className="tiny">Socials</span>
          {contact.links.map((link) => {
            const logo = socialLogo(link.name);
            return (
              <a key={link.id} className="social-row" href={href(link.url)} target="_blank" rel="noreferrer">
                <span className="token-logo sm">{logo ? <img src={logo} alt="" /> : initials(link.name)}</span>
                <span>{link.name}</span>
                <b>{link.handle || link.url}</b>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
