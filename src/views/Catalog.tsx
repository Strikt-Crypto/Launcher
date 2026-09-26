"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react";
import { Empty, Pill, Select, Tabs, ViewSwitch } from "../components/ui";
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
    ? store.packages.filter((pack) => (phase === "all" || pack.phase === phase) && `${pack.name} ${pack.summary}`.toLowerCase().includes(query.trim().toLowerCase()))
    : [];
  const cards = [
    ...packs.map((pack) => ({ id: pack.id, name: pack.name, kind: "package" as const, pack })),
    ...rows.map((service) => ({ id: service.id, name: service.name, kind: "service" as const, service })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="page screen">
      <div className="tool-bar">
        <Tabs
          value={phase}
          onChange={(id) => setPhase(id as PhaseId | "all")}
          tabs={[
            { id: "all", label: "All", count: menu.length + (scope === "all" ? store.packages.length : 0) },
            ...catalogPhases.map((item) => ({ id: item.id, label: item.label, count: menu.filter((service) => service.phase === item.id).length + (scope === "all" ? store.packages.filter((pack) => pack.phase === item.id).length : 0) })),
          ]}
        />
        <div className="tool-end">
          {scope !== "services" && <Select value={kind} onChange={(value) => setKind(value as ServiceKind | "all")} options={[{ value: "all", label: "All kinds" }, ...SERVICE_KINDS.map((item) => ({ value: item.id, label: item.label }))]} />}
          <input className="input" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
          <ViewSwitch value={view} onChange={setView} />
        </div>
      </div>
      <div className="desk-fit">
      {cards.length === 0 && (menu.length === 0 && store.packages.length === 0 && !query.trim() ? <Empty title="Nothing in the catalog" text="New service starts a line." /> : <Empty title="Nothing in this filter" text="Try another phase or clear the search." />)}
      {cards.length > 0 && (
        view === "table" ? (
          <div className="table-wrap">
            <table className="blotter catalog">
              <thead><tr><th>Name</th><th>Type</th><th>Price</th></tr></thead>
              <tbody>
                {cards.map((card) => card.kind === "package" ? (
                  <tr key={card.id}>
                    <td><Link className="name-link token-cell" href={`/packages/${card.pack.id}`}><span className="token-logo sm">{packageMark(card.pack, store.platforms) ? <img src={packageMark(card.pack, store.platforms)} alt="" /> : initials(card.pack.name)}</span><span><strong>{card.pack.name}</strong></span></Link></td>
                    <td>Package</td>
                    <td className="price">{money(card.pack.price, card.pack.currency)}</td>
                  </tr>
                ) : (
                  <tr key={card.id}>
                    <td><Link className="name-link token-cell" href={`/catalog/${card.service.id}`}><span className="token-logo sm">{serviceMark(card.service, store.platforms) ? <img src={serviceMark(card.service, store.platforms)} alt="" /> : initials(card.service.name)}</span><span><strong>{card.service.name}</strong></span></Link></td>
                    <td>Service</td>
                    <td className="price">{servicePriceLabel(card.service)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="project-grid">
            {cards.map((card) => card.kind === "package" ? (
              <article key={card.id} className="project-card">
                <Link href={`/packages/${card.pack.id}`} className="card-hit" aria-label={card.pack.name} />
                <div className="card-top">
                  <span className="token-logo">{packageMark(card.pack, store.platforms) ? <img src={packageMark(card.pack, store.platforms)} alt="" /> : initials(card.pack.name)}</span>
                  <div className="card-id">
                    <strong>{card.pack.name}</strong>
                    <div className="tiny">{byId(store.providers, card.pack.providerId)?.name || "Package"}</div>
                  </div>
                  <Pill>Package</Pill>
                </div>
                <div className="card-stat">
                  <div>
                    <div className="tiny">Price</div>
                    <div className="figure">{money(card.pack.price, card.pack.currency)}</div>
                  </div>
                  <button type="button" className="btn btn-small lift" onClick={() => ui.openAdd({ packageId: card.pack.id })}><Plus size={14} />Add</button>
                </div>
                <div className="lane-grid">
                  <div><span>Outlets</span><span className="num">{card.pack.outlets.length}</span></div>
                  <div><span>Includes</span><span className="num">{card.pack.includes.length}</span></div>
                  <div><span>Guarantees</span><span className="num">{card.pack.guarantees.length}</span></div>
                  <div><span>Extras</span><span className="num">{card.pack.extras.length}</span></div>
                </div>
              </article>
            ) : (
              <article key={card.id} className="project-card">
                <Link href={`/catalog/${card.service.id}`} className="card-hit" aria-label={card.service.name} />
                <div className="card-top">
                  <span className="token-logo">{serviceMark(card.service, store.platforms) ? <img src={serviceMark(card.service, store.platforms)} alt="" /> : initials(card.service.name)}</span>
                  <div className="card-id">
                    <strong>{card.service.name}</strong>
                    <div className="tiny">{byId(store.providers, card.service.providerId)?.name || "Service"}</div>
                  </div>
                  <Pill>Service</Pill>
                </div>
                <div className="card-stat">
                  <div>
                    <div className="tiny">Price</div>
                    <div className="figure">{servicePriceLabel(card.service)}</div>
                  </div>
                  <button type="button" className="btn btn-small lift" onClick={() => ui.openAdd({ serviceId: card.service.id })}><Plus size={14} />Add</button>
                </div>
                <div className="lane-grid">
                  <div><span>Phase</span><span className="num">{catalogPhases.find((item) => item.id === card.service.phase)?.label || card.service.phase}</span></div>
                  <div><span>Seller</span><span className="num">{byId(store.providers, card.service.providerId)?.name || "—"}</span></div>
                  <div><span>Also</span><span className="num">{card.service.recurring ? `+ ${card.service.recurring.price.toLocaleString("en-US")} / ${card.service.recurring.every}` : "—"}</span></div>
                  <div><span>Kind</span><span className="num">Service</span></div>
                </div>
              </article>
            ))}
          </div>
        )
      )}
      </div>
    </div>
  );
}
