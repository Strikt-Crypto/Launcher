"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { Confirm, Empty, Pill } from "../components/ui";
import { byId, href, money } from "../lib/format";
import { SERVICE_KINDS, phaseOf } from "../lib/labels";
import { outletMark, serviceMark } from "../lib/marks";
import { initials } from "../lib/logo";
import { useStore } from "../store";
import { useUi } from "../ui";

export function ServicePage() {
  const { id } = useParams();
  const store = useStore();
  const ui = useUi();
  const router = useRouter();
  const service = store.services.find((item) => item.id === id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tierId, setTierId] = useState(service?.tiers[0]?.id || "");
  if (!service) return <div className="page"><Empty title="Service missing" text="It was removed from the catalog." action={<Link href="/catalog/services" className="btn">Services</Link>} /></div>;
  const provider = byId(store.providers, service.providerId);
  const phase = phaseOf(service.phase);
  const tier = service.tiers.find((item) => item.id === tierId) || service.tiers[0];
  const kind = SERVICE_KINDS.find((item) => item.id === service.kind)?.label || "Service";
  const price = !tier || (service.openPrice && tier.price === 0) ? "Open" : money(tier.price, tier.currency);

  return (
    <div className="page">
      <header className="card desk-head has-mark">
        <span className="mark token-logo lg">{serviceMark(service, store.platforms) ? <img src={serviceMark(service, store.platforms)} alt="" /> : initials(service.name)}</span>
        <div className="kicker">{phase.n} · {phase.label} · {kind}</div>
        <h1 className="display">{service.name}</h1>
        <p className="lede">{service.summary}</p>
        <div className="desk-figure">
          <div className="tiny">{tier ? tier.label : "Price"}</div>
          <div className="figure">{price}</div>
          {service.recurring && <div className="tiny">+ {money(service.recurring.price, service.recurring.currency)} / {service.recurring.every}</div>}
        </div>
        <div className="desk-head-actions">
          <Link className="btn" href={`/catalog/${service.id}/edit`}><PencilSimple size={16} />Edit</Link>
          <button type="button" className="btn btn-primary" onClick={() => ui.openAdd({ serviceId: service.id, tierId: tier?.id })}><Plus size={16} weight="bold" />Add to project</button>
        </div>
      </header>

      <div className="quote-layout service-split">
        <div className="stack">
          {service.tiers.length > 0 && (
            <section className="card stack">
              <h2>Price</h2>
              <div className="tier-grid">
                {service.tiers.map((item) => {
                  const extra = [item.duration, item.note].filter((bit) => bit && bit.toLowerCase() !== item.label.toLowerCase());
                  return (
                    <button key={item.id} type="button" className={tier?.id === item.id ? "tier-card on" : "tier-card"} onClick={() => setTierId(item.id)}>
                      <div className="tiny">{item.label}</div>
                      <strong>{service.openPrice && item.price === 0 ? "Open" : money(item.price, item.currency)}</strong>
                      {extra.length > 0 && <div className="tiny">{extra.join(" · ")}</div>}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
          {service.details && (
            <section className="card">
              <h2>How it works</h2>
              <p className="muted" style={{ marginTop: 8 }}>{service.details}</p>
            </section>
          )}
          {service.requirements.length > 0 && (
            <section className="card hold req-card">
              <h2>Requirements</h2>
              <div className="card-scroll"><div className="row-list">
                {service.requirements.map((item) => (
                  <div key={item.id}>
                    <span>{item.text}</span>
                    {item.critical && <Pill tone="clay">Critical</Pill>}
                  </div>
                ))}
              </div></div>
            </section>
          )}
          {service.includes.length > 0 && (
            <section className="card hold">
              <h2>Included</h2>
              <div className="card-scroll"><div className="outlet-grid">
                {service.includes.map((item) => {
                  const logo = outletMark(item.label, item.url, store.platforms);
                  const body = <><span className="brand-bit">{logo && <img className="mark-logo" src={logo} alt="" />}<strong>{item.label}</strong></span>{item.note && <span className="tiny">{item.note}</span>}</>;
                  return item.url
                    ? <a key={item.label} href={href(item.url)} target="_blank" rel="noreferrer">{body}</a>
                    : <span key={item.label}>{body}</span>;
                })}
              </div></div>
            </section>
          )}
        </div>

        <div className="stack">
        <aside className="card offer-side">
          <div className="tiny">Seller</div>
          {provider ? <Link href={`/providers/${provider.id}`}><strong>{provider.name}</strong><div className="muted">{provider.role}</div></Link> : <p className="muted">Unassigned</p>}
          <dl className="facts">
            <dt>Status</dt>
            <dd>{service.available ? "Available" : "Unavailable"}</dd>
            <dt>Phase</dt>
            <dd>{phase.label}</dd>
            <dt>Kind</dt>
            <dd>{kind}</dd>
            <dt>Chains</dt>
            <dd>{service.chains.length ? service.chains.join(", ") : "Any"}</dd>
          </dl>
          <div className="tiny">Platforms</div>
          {service.platformIds.length === 0 && <p className="muted">None linked.</p>}
          <div className="stack">
            {service.platformIds.map((pid) => {
              const platform = byId(store.platforms, pid);
              return platform ? <Link key={pid} href={`/platforms/${pid}`} className="brand-bit">{platform.logo && <img className="mark-logo" src={platform.logo} alt="" />}{platform.name}</Link> : null;
            })}
            {service.links.map((link) => <a key={link.url} href={href(link.url)} target="_blank" rel="noreferrer">{link.label}</a>)}
          </div>
          <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)}><Trash size={16} />Delete service</button>
        </aside>
        {service.rules.length > 0 && (
          <section className="card hold">
            <h2>Rules</h2>
            <div className="card-scroll stack">
            {service.rules.map((rule) => <p key={rule} className="muted">{rule}</p>)}
            </div>
          </section>
        )}
        </div>
      </div>

      <Confirm open={confirmDelete} title={`Delete ${service.name}?`} text="Plans that already copied this item keep their rows." confirm="Delete" onConfirm={() => { store.deleteService(service.id); router.push("/catalog/services"); }} onClose={() => setConfirmDelete(false)} />
    </div>
  );
}
