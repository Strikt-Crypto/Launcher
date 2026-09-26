"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Check, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { Confirm, CopyIcon, Empty } from "../components/ui";
import { byId, href, money, whatsappHref } from "../lib/format";
import { COUNTRIES, SERVICE_KINDS, phaseOf } from "../lib/labels";
import { serviceMark } from "../lib/marks";
import { initials } from "../lib/logo";
import { SocialMark, hasSocialMark } from "../components/SocialMark";
import { useStore } from "../store";
import { useUi } from "../ui";
import type { Contact, Platform, Service } from "../types";

export function ServicePage() {
  const { id } = useParams();
  const store = useStore();
  const ui = useUi();
  const router = useRouter();
  const service = store.services.find((item) => item.id === id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tierId, setTierId] = useState(service?.tiers[0]?.id || "");
  const [pickedId, setPickedId] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  if (service && pickedId !== service.id) {
    setPickedId(service.id);
    setPicked([]);
  }
  if (!service) return <div className="page"><Empty title="Service missing" text="It was removed from the catalog." action={<Link href="/catalog/services" className="btn">Services</Link>} /></div>;
  const provider = byId(store.providers, service.providerId);
  const phase = phaseOf(service.phase);
  const tier = service.tiers.find((item) => item.id === tierId) || service.tiers[0];
  const kind = SERVICE_KINDS.find((item) => item.id === service.kind)?.label || "Service";
  const price = !tier || (service.openPrice && tier.price === 0) ? "Ask the leads" : money(tier.price, tier.currency);
  const kicker = [phase.n === "00" ? "" : phase.n, phase.label, provider?.name === kind ? "" : kind].filter(Boolean).join(" · ");
  const people = service.contactId
    ? store.contacts.filter((item) => item.id === service.contactId)
    : store.contacts.filter((item) => item.providerId === service.providerId);
  const hasWork = service.requirements.length > 0;
  const hasInside = !hasWork && service.includes.length > 0;
  const hasGeo = Boolean(service.countryPick);
  const hasDetail = Boolean(service.details) || service.rules.length > 0 || people.length > 0;
  const cards = 1 + (hasWork || hasInside ? 1 : 0) + (hasGeo ? 1 : 0) + (hasDetail ? 1 : 0) + 1;
  const board = cards >= 4 ? "four" : cards === 3 && hasGeo ? "three geo" : cards === 3 && hasWork ? "three sheet" : cards === 3 ? "three" : "pair";

  return (
    <div className="page screen">
      <header className="card desk-head has-mark">
        <span className="mark token-logo lg">{serviceMark(service, store.platforms) ? <img src={serviceMark(service, store.platforms)} alt="" /> : initials(service.name)}</span>
        <div className="desk-copy">
          <div className="kicker">{kicker}{provider ? <>{kicker ? " · " : ""}<Link href={`/providers/${provider.id}`}>{provider.name}</Link></> : ""}</div>
          <h1 className="display copy-line"><span>{service.name}</span><CopyIcon text={service.name} /></h1>
        </div>
        <div className="desk-figure">
          <div className="tiny">{tier ? tier.label : "Price"}</div>
          <div className="figure">{price}</div>
          {service.recurring && <div className="tiny">+ {money(service.recurring.price, service.recurring.currency)} / {service.recurring.every}</div>}
        </div>
        <div className="desk-head-actions">
          <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)}><Trash size={16} />Delete</button>
          <Link className="btn" href={`/catalog/${service.id}/edit`}><PencilSimple size={16} />Edit</Link>
          <button type="button" className="btn btn-primary" onClick={() => ui.openAdd({ serviceId: service.id, tierId: tier?.id, countries: picked })}><Plus size={16} weight="bold" />Add to project</button>
        </div>
      </header>
      <div className="desk-fit">
        <div className={`offer-board ${board}`}>{serviceBoard(service, tier?.id || "", setTierId, store.platforms, people, (value) => store.updateService(service.id, { notes: value }), picked, (name) => {
          const max = service.countryPick?.max ?? 4;
          setPicked((current) => current.includes(name) ? current.filter((item) => item !== name) : current.length >= max ? current : [...current, name]);
        })}</div>
      </div>
      <Confirm open={confirmDelete} title={`Delete ${service.name}?`} text="Plans that already copied this item keep their rows." confirm="Delete" onConfirm={() => { store.deleteService(service.id); router.push("/catalog/services"); }} onClose={() => setConfirmDelete(false)} />
    </div>
  );
}

function ContactSheet({ contact }: { contact: Contact }) {
  const [photoOff, setPhotoOff] = useState(false);
  const reach = [
    contact.phone ? { label: "Number", value: contact.phone, href: whatsappHref(contact.phone) } : null,
    contact.email ? { label: "Email", value: contact.email, href: href(contact.email) } : null,
  ].filter((item): item is { label: string; value: string; href: string } => Boolean(item));
  const role = [contact.title, contact.company].filter(Boolean).join(" · ");
  return (
    <div className="who-board">
      <Link href={`/contacts/${contact.id}`} className="who-lead">
        <span className="token-logo">{contact.image && !photoOff ? <img src={contact.image} alt="" onError={() => setPhotoOff(true)} /> : initials(contact.name.replace(/^@/, ""))}</span>
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
              <span className="copy-line"><b>{item.value}</b><CopyIcon text={item.value} /></span>
            </a>
          ))}
        </div>
      )}
      {contact.links.length > 0 && (
        <div className="req-pair">
          <span className="tiny">Socials</span>
          {contact.links.map((link) => {
            return (
              <a key={link.id} className="social-row" href={href(link.url)} target="_blank" rel="noreferrer">
                <span className="token-logo sm">{hasSocialMark(link.name) ? <SocialMark name={link.name} /> : initials(link.name)}</span>
                <span>{link.name}</span>
                <span className="copy-line"><b>{link.handle || link.url}</b><CopyIcon text={link.handle || link.url} /></span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

function requirementBoard(items: Service["requirements"]) {
  const lead = items.find((item) => item.id === "lp") || items[0];
  const rest = items.filter((item) => item !== lead);
  const volume = rest.filter((item) => item.id === "v1" || item.id === "v24");
  const checks = rest.filter((item) => item.id === "charts" || item.id === "warn");
  const grouped = new Set([...volume, ...checks].map((item) => item.id));
  const loose = rest.filter((item) => !grouped.has(item.id));
  const pairs = [
    volume.length ? { title: "Volume", items: volume } : null,
    checks.length ? { title: "Checks", items: checks } : null,
    ...chunk(loose, 2).map((group, index) => ({ title: group.length > 1 ? "Also" : reqFace(group[0].text).label, items: group, key: `loose-${index}` })),
  ].filter((group): group is { title: string; items: Service["requirements"]; key?: string } => Boolean(group));
  const leadFace = reqFace(lead.text);
  const [amount, where] = leadFace.value.split(" · ");
  return (
    <>
      <div className="stat req-lead">
        <span className="stat-top">
          <span className="tiny">{leadFace.label || "Bar"}</span>
          <i className="crit">Critical</i>
        </span>
        <span className="stat-val">
          <b>{amount}</b>
          {where ? <span className="tiny">{where}</span> : null}
        </span>
      </div>
      {pairs.map((group) => (
        <div key={group.key || group.title} className="req-pair">
          <span className="tiny">{group.title}</span>
          {group.items.map((item) => {
            const face = reqFace(item.text);
            return (
              <div key={item.id} className="stat nest">
                <span className="stat-top">
                  <span className="tiny">{factHead(face.label, group.title) || face.value}</span>
                  <i className="crit">Critical</i>
                </span>
                {face.label ? <b>{face.value}</b> : null}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

function factHead(label: string, group: string) {
  const trimmed = label.replace(new RegExp(`\\s*${group}$`, "i"), "").trim();
  return trimmed || label;
}

function chunk<T>(items: T[], size: number) {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) groups.push(items.slice(index, index + size));
  return groups;
}

function reqFace(text: string) {
  const [head, ...rest] = text.split(" · ");
  if (!rest.length) return { label: "", value: text };
  return { label: head, value: rest.join(" · ") };
}

function priceCells(service: Service, tierId: string): [string, string][] {
  const tier = service.tiers.find((item) => item.id === tierId) || service.tiers[0];
  if (!tier) return [["Amount", "—"]];
  if (service.openPrice && tier.price === 0 && tier.duration && tier.note) {
    return [
      ["Price", "Ask the leads"],
      ["Coverage", tier.label],
      ["Channels", tier.duration],
      ["Teams", tier.note],
    ];
  }
  if (tier.duration === "Listing") {
    return [
      ["Amount", money(tier.price, tier.currency)],
      ["Wallet", "Robinhood"],
      ["Status", "Available"],
      ["Type", "Listing"],
    ];
  }
  const amount = service.openPrice && tier.price === 0 ? "Ask the leads" : money(tier.price, tier.currency);
  const window = tier.duration || tier.label;
  const cells: [string, string][] = [
    ["Amount", amount],
    ["Window", window],
  ];
  const hours = hourCount(window);
  if (hours && tier.price > 0 && !service.openPrice) cells.push(["Each hour", money(tier.price / hours, tier.currency)]);
  const span = spanOf(window);
  if (service.countryPick) cells.push(["Wording", "Cashtag or wording"]);
  else if (tier.note?.startsWith("Ranks")) cells.push(["Covers", tier.note]);
  else if (tier.note?.includes("mostly")) cells.push(["Position", tier.note]);
  else if (tier.note) cells.push(["Wallet", tier.note]);
  else if (span) cells.push(span);
  return cells;
}

function hourCount(label: string) {
  const hours = /(\d+)\s*hour/i.exec(label);
  if (hours) return Number(hours[1]);
  const days = /(\d+)\s*day/i.exec(label);
  if (days) return Number(days[1]) * 24;
  const weeks = /(\d+)\s*week/i.exec(label);
  if (weeks) return Number(weeks[1]) * 24 * 7;
  return 0;
}

function spanOf(label: string): [string, string] | null {
  const days = /(\d+)\s*day/i.exec(label);
  if (days) return ["Hours", String(Number(days[1]) * 24)];
  const weeks = /(\d+)\s*week/i.exec(label);
  if (weeks) return ["Days", String(Number(weeks[1]) * 7)];
  return null;
}

function serviceBoard(service: Service, tierId: string, setTierId: (id: string) => void, platforms: Platform[], contacts: Contact[], onNote: (value: string) => void, picked: string[], onPick: (name: string) => void) {
  const facts = service.rules;
  return (
    <>
      <section className="card">
        <h2>Price</h2>
        {service.tiers.length > 1 && (
          <div className="line-grid">
            {service.tiers.map((item) => (
              <button key={item.id} type="button" className={tierId === item.id ? "line-tile on" : "line-tile"} onClick={() => setTierId(item.id)}>
                <span className="token-logo sm">{serviceMark(service, platforms) ? <img src={serviceMark(service, platforms)} alt="" /> : initials(service.name)}</span>
                <span className="line-copy">
                  <b>{item.label}</b>
                  {item.duration && item.duration !== item.label ? <span className="tiny">{item.duration}</span> : item.note && item.note !== item.label ? <span className="tiny">{item.note}</span> : null}
                </span>
                <b className="num">{service.openPrice && item.price === 0 ? "Ask the leads" : money(item.price, item.currency)}</b>
              </button>
            ))}
          </div>
        )}
        <div className={priceCells(service, tierId).length <= 2 ? "price-grid rows-1" : "price-grid"}>
          {priceCells(service, tierId).map(([label, value]) => {
            const [head, ...rest] = label === "Position" ? value.split(" · ") : [value];
            return (
              <div key={label} className="stat">
                <span className="stat-top"><span className="tiny">{label}</span></span>
                <span className="stat-val">
                  <b>{head}</b>
                  {rest.length > 0 ? <span className="tiny">{rest.join(" · ")}</span> : null}
                </span>
              </div>
            );
          })}
        </div>
      </section>
      {service.requirements.length > 0 && (
        <section className="card">
          <h2>Requirements</h2>
          <div className="req-board">
            {requirementBoard(service.requirements)}
          </div>
        </section>
      )}
      {service.requirements.length === 0 && service.includes.length > 0 && (
        <section className="card">
          <h2>Inside</h2>
          <div className="inside-grid">
            {service.includes.map((item) => (
              <div key={item.label} className="stat">
                <span className="stat-top"><span className="tiny">{item.label}</span></span>
                <b>{item.note || item.label}</b>
              </div>
            ))}
          </div>
        </section>
      )}
      {service.countryPick && (
        <section className="card">
          <h2>Countries</h2>
          <div className="stat geo-lead">
            <span className="stat-top"><span className="tiny">Pick</span></span>
            <span className="stat-val">
              <b>{picked.length} / {service.countryPick.max}</b>
              {service.countryPick.includesWorldwide ? <span className="tiny">Worldwide included</span> : null}
            </span>
          </div>
          <div className="line-fill">
            {COUNTRIES.map((name) => {
              const on = picked.includes(name);
              return (
                <button key={name} type="button" className={on ? "list-row pick on" : "list-row pick"} onClick={() => onPick(name)}>
                  <span>{name}</span>
                  {on ? <Check size={16} weight="bold" /> : null}
                </button>
              );
            })}
          </div>
        </section>
      )}
      {(contacts.length > 0 || facts.length > 0 || service.details) && (
        <section className="card">
          <h2>Details</h2>
          {contacts.length > 1 ? (
            <div className="lead-board">
              {contacts.map((contact) => <ContactSheet key={contact.id} contact={contact} />)}
            </div>
          ) : contacts[0] ? <ContactSheet contact={contacts[0]} /> : null}
          {facts.length > 0 && (
            <div className="line-fill">
              {facts.map((text) => (
                <div key={text} className="list-row solo"><span>{text}</span></div>
              ))}
            </div>
          )}
          {service.details ? <div className="note-read slim">{service.details}</div> : null}
        </section>
      )}
      <section className="card note-pad">
        <h2>Note</h2>
        <textarea className="note-field" value={service.notes || ""} placeholder="Write a note" onChange={(event) => onNote(event.target.value)} />
      </section>
    </>
  );
}
