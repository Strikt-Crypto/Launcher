"use client";

import { useState } from "react";
import Link from "next/link";
import { ProviderEditor } from "../components/editors";
import { PageHead, Pill, Select, Tabs } from "../components/ui";
import { deskMark } from "../lib/marks";
import { initials } from "../lib/logo";
import { useStore } from "../store";

export function Providers() {
  const store = useStore();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [role, setRole] = useState("all");
  const [open, setOpen] = useState(false);
  const q = query.trim().toLowerCase();
  const regions = [...new Set(store.providers.map((provider) => provider.region.trim()).filter(Boolean))].sort();
  const roles = [...new Set(store.providers.map((provider) => provider.role.trim()).filter(Boolean))].sort();
  const rows = store.providers.filter((provider) => {
    if (region !== "all" && provider.region !== region) return false;
    if (role !== "all" && provider.role !== role) return false;
    return `${provider.name} ${provider.role} ${provider.region}`.toLowerCase().includes(q);
  });
  return (
    <div className="page">
      <PageHead kicker="Spend" title="Sellers" lede="Who a launch pays. Site, Telegram, X, Discord, and email live on each one." actions={<button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>New seller</button>} />
      <div className="tool-bar">
        <Tabs
          value={region}
          onChange={setRegion}
          tabs={[
            { id: "all", label: "All", count: store.providers.length },
            ...regions.map((name) => ({ id: name, label: name, count: store.providers.filter((provider) => provider.region === name).length })),
          ]}
        />
        <div className="tool-end">
          <Select value={role} onChange={setRole} options={[{ value: "all", label: "All roles" }, ...roles.map((name) => ({ value: name, label: name }))]} />
          <input className="input" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>
      <div className="project-grid">
        {rows.map((provider) => {
          const services = store.services.filter((item) => item.providerId === provider.id).length;
          const packs = store.packages.filter((item) => item.providerId === provider.id).length;
          return (
            <Link key={provider.id} href={`/providers/${provider.id}`} className="project-card">
              <div className="card-top">
                <span className="token-logo">{deskMark(provider, store.platforms) ? <img src={deskMark(provider, store.platforms)} alt="" /> : initials(provider.name)}</span>
                <div className="card-id">
                  <strong>{provider.name}</strong>
                  <div className="tiny">{provider.role || "Role not set"}</div>
                </div>
                <Pill>{provider.region || "Seller"}</Pill>
              </div>
              <div className="card-stat">
                <div>
                  <div className="tiny">Offers</div>
                  <div className="figure">{services + packs}</div>
                </div>
              </div>
              <div className="lane-grid">
                <div><span>Services</span><span className="num">{services}</span></div>
                <div><span>Packages</span><span className="num">{packs}</span></div>
                <div><span>Region</span><span className="num">{provider.region || "Not set"}</span></div>
                <div><span>Role</span><span className="num">{provider.role || "Not set"}</span></div>
              </div>
            </Link>
          );
        })}
      </div>
      <ProviderEditor open={open} initial={null} onClose={() => setOpen(false)} />
    </div>
  );
}
