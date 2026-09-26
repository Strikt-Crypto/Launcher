"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react";
import { Empty, PageHead, Pill, Select, Tabs, ViewSwitch } from "../components/ui";
import { byId, money } from "../lib/format";
import { PHASES, SERVICE_KINDS } from "../lib/labels";
import { packageMark, serviceMark } from "../lib/marks";
import { initials } from "../lib/logo";
import { servicePriceLabel } from "../lib/price";
import { useStore } from "../store";
import { useUi } from "../ui";
import type { PhaseId, ServiceKind } from "../types";

export function Catalog({ scope = "all" }: { scope?: "all" | "services" }) {
  const store = useStore();
  const ui = useUi();
  const [phase, setPhase] = useState<PhaseId | "all">("all");
  const [kind, setKind] = useState<ServiceKind | "all">("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "table">("grid");
  const catalogPhases = PHASES;
  const menu = scope === "services" ? store.services.filter((service) => service.kind === "service") : store.services;
  const rows = menu.filter((service) => {
    const hay = `${service.name} ${service.summary}`.toLowerCase();
    return (phase === "all" || service.phase === phase) && (kind === "all" || service.kind === kind) && hay.includes(query.trim().toLowerCase());
  });
  const packs = scope === "all"
    ? store.packages.filter((pack) => `${pack.name} ${pack.summary}`.toLowerCase().includes(query.trim().toLowerCase()))
    : [];
  const groups = catalogPhases.filter((item) => phase === "all" || phase === item.id)
    .map((item) => ({ ...item, list: rows.filter((service) => service.phase === item.id) }))
    .filter((item) => item.list.length > 0);

  return (
    <div className="page">
      <PageHead kicker="Menu" title={scope === "services" ? "Services" : "Catalog"} lede={scope === "services" ? "Each service on its own, apart from the packs." : "Everything on the menu. Packages and services each have their own list under this."} actions={<Link className="btn btn-primary" href="/catalog/new"><Plus size={16} weight="bold" />New service</Link>} />
      <div className="tool-bar">
        <Tabs
          value={phase}
          onChange={(id) => setPhase(id as PhaseId | "all")}
          tabs={[
            { id: "all", label: "All", count: menu.length },
            ...catalogPhases.map((item) => ({ id: item.id, label: item.label, count: menu.filter((service) => service.phase === item.id).length })),
          ]}
        />
        <div className="tool-end">
          {scope !== "services" && <Select value={kind} onChange={(value) => setKind(value as ServiceKind | "all")} options={[{ value: "all", label: "All kinds" }, ...SERVICE_KINDS.map((item) => ({ value: item.id, label: item.label }))]} />}
          <input className="input" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
          <ViewSwitch value={view} onChange={setView} />
        </div>
      </div>
      {groups.length === 0 && packs.length === 0 && <Empty title="Nothing in this filter" text="Try another phase or clear the search." />}
      {phase === "all" && packs.length > 0 && (
        <section className="section">
          {view === "table" ? (
            <div className="table-wrap">
              <table className="blotter catalog">
                <thead><tr><th>Package</th><th>Type</th><th>Price</th><th>Outlets</th></tr></thead>
                <tbody>
                  {packs.map((pack) => (
                    <tr key={pack.id}>
                      <td><Link className="name-link" href={`/packages/${pack.id}`}><strong>{pack.name}</strong></Link></td>
                      <td>{pack.group === "bundle" ? "Bundle" : "Package"}</td>
                      <td className="price">{money(pack.price, pack.currency)}</td>
                      <td>{pack.outlets.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
          <div className="project-grid">
            {packs.map((pack) => (
              <article key={pack.id} className="project-card">
                <Link href={`/packages/${pack.id}`} className="card-hit" aria-label={pack.name} />
                <div className="card-top">
                  <span className="token-logo">{packageMark(pack, store.platforms) ? <img src={packageMark(pack, store.platforms)} alt="" /> : pack.group === "bundle" ? "Pk" : String(pack.rank).padStart(2, "0")}</span>
                  <div className="card-id">
                    <strong>{pack.name}</strong>
                    <div className="tiny">{pack.group === "bundle" ? "Bundle" : `Step ${String(pack.rank).padStart(2, "0")}`}</div>
                  </div>
                  <Pill>{pack.group === "bundle" ? "Bundle" : "Package"}</Pill>
                </div>
                <div className="card-stat">
                  <div>
                    <div className="tiny">Price</div>
                    <div className="figure">{money(pack.price, pack.currency)}</div>
                  </div>
                  <button type="button" className="btn btn-small lift" onClick={() => ui.openAdd({ packageId: pack.id })}><Plus size={14} />Add</button>
                </div>
                <div className="lane-grid">
                  <div><span>Outlets</span><span className="num">{pack.outlets.length}</span></div>
                  <div><span>Includes</span><span className="num">{pack.includes.length}</span></div>
                  <div><span>Guarantees</span><span className="num">{pack.guarantees.length}</span></div>
                  <div><span>Extras</span><span className="num">{pack.extras.length}</span></div>
                </div>
              </article>
            ))}
          </div>
          )}
        </section>
      )}
      {rows.length > 0 && (
        <section className="section">
          {view === "table" ? (
            <div className="table-wrap">
              <table className="blotter catalog">
                <thead><tr><th>Service</th><th>Seller</th><th>Phase</th><th>Price</th></tr></thead>
                <tbody>
                  {rows.map((service) => {
                    const desk = byId(store.providers, service.providerId)?.name || "Unassigned";
                    const phase = catalogPhases.find((item) => item.id === service.phase)?.label || service.phase;
                    return (
                      <tr key={service.id}>
                        <td><Link className="name-link" href={`/catalog/${service.id}`}><strong>{service.name}</strong></Link></td>
                        <td>{desk}</td>
                        <td>{phase}</td>
                        <td className="price">{servicePriceLabel(service)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
          <div className="project-grid">
            {rows.map((service) => {
              const kind = SERVICE_KINDS.find((item) => item.id === service.kind)?.label || "Service";
              const desk = byId(store.providers, service.providerId)?.name || "Unassigned";
              const phase = catalogPhases.find((item) => item.id === service.phase)?.label || service.phase;
              return (
                <article key={service.id} className="project-card">
                  <Link href={`/catalog/${service.id}`} className="card-hit" aria-label={service.name} />
                  <div className="card-top">
                    <span className="token-logo">{serviceMark(service, store.platforms) ? <img src={serviceMark(service, store.platforms)} alt="" /> : initials(service.name)}</span>
                    <div className="card-id">
                      <strong>{service.name}</strong>
                      <div className="tiny">{desk}</div>
                    </div>
                    {service.available ? <Pill tone="sage">Available</Pill> : <Pill tone="clay">Unavailable</Pill>}
                  </div>
                  <div className="card-stat">
                    <div>
                      <div className="tiny">Price</div>
                      <div className="figure">{servicePriceLabel(service)}</div>
                    </div>
                    <button type="button" className="btn btn-small lift" onClick={() => ui.openAdd({ serviceId: service.id })}><Plus size={14} />Add</button>
                  </div>
                  <div className="lane-grid">
                    <div><span>Kind</span><span className="num">{kind}</span></div>
                    <div><span>Phase</span><span className="num">{phase}</span></div>
                    <div><span>Seller</span><span className="num">{desk}</span></div>
                    <div><span>Also</span><span className="num">{service.recurring ? `+ ${service.recurring.price.toLocaleString("en-US")} / ${service.recurring.every}` : "—"}</span></div>
                  </div>
                </article>
              );
            })}
          </div>
          )}
        </section>
      )}
    </div>
  );
}
