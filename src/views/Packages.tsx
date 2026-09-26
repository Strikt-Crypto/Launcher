"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react";
import { Empty, Pill, Select, Tabs, ViewSwitch } from "../components/ui";
import { money } from "../lib/format";
import { initials } from "../lib/logo";
import { packageMark } from "../lib/marks";
import { useStore } from "../store";
import { useUi } from "../ui";

export function Packages() {
  const store = useStore();
  const ui = useUi();
  const [picked, setPicked] = useState<string[]>([]);
  const [group, setGroup] = useState<"all" | "pr" | "bundle" | "budget">("all");
  const [desk, setDesk] = useState("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "table">("grid");
  const q = query.trim().toLowerCase();
  const desks = store.providers.filter((provider) => store.packages.some((pack) => pack.providerId === provider.id));
  const match = (item: (typeof store.packages)[number]) =>
    (group === "all" || item.group === group) &&
    (desk === "all" || item.providerId === desk) &&
    `${item.name} ${item.summary}`.toLowerCase().includes(q);
  const bundles = store.packages.filter((item) => item.group === "bundle" && match(item));
  const budgets = store.packages.filter((item) => item.group === "budget" && match(item)).sort((a, b) => a.name.localeCompare(b.name));
  const ladder = store.packages.filter((item) => item.group === "pr" && match(item)).sort((a, b) => a.rank - b.rank);
  const cards = [...bundles, ...budgets, ...ladder];
  const compared = ladder.filter((item) => picked.includes(item.id));

  function toggle(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id].slice(0, 3)));
  }

  return (
    <div className="page screen">
      <div className="tool-bar">
        <Tabs
          value={group}
          onChange={(id) => setGroup(id as "all" | "pr" | "bundle" | "budget")}
          tabs={[
            { id: "all", label: "All", count: store.packages.length },
            { id: "budget", label: "Budget", count: store.packages.filter((item) => item.group === "budget").length },
            { id: "pr", label: "Article PR", count: store.packages.filter((item) => item.group === "pr").length },
            { id: "bundle", label: "Bundles", count: store.packages.filter((item) => item.group === "bundle").length },
          ]}
        />
        <div className="tool-end">
          <Select value={desk} onChange={setDesk} options={[{ value: "all", label: "All sellers" }, ...desks.map((provider) => ({ value: provider.id, label: provider.name }))]} />
          <input className="input" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
          <ViewSwitch value={view} onChange={setView} />
        </div>
      </div>
      <div className="desk-fit">
      {cards.length === 0 && <Empty title="No packages yet" text="New package starts one." />}
      {cards.length > 0 && (
          <section className="section">
            {view === "table" ? (
              <div className="table-wrap">
                <table className="blotter catalog">
                  <thead><tr><th>Package</th><th>Type</th><th>Price</th><th>Outlets</th></tr></thead>
                  <tbody>
                    {cards.map((pack) => (
                      <tr key={pack.id}>
                        <td><Link className="name-link token-cell" href={`/packages/${pack.id}`}><span className="token-logo sm">{packageMark(pack, store.platforms) ? <img src={packageMark(pack, store.platforms)} alt="" /> : initials(pack.name)}</span><span><strong>{pack.name}</strong></span></Link></td>
                        <td>{pack.group === "pr" ? "Article PR" : pack.id.startsWith("mods-") ? "Mods" : pack.id === "artem-tier-1" ? "Tier 1" : pack.group === "budget" ? "Budget" : "Bundle"}</td>
                        <td className="price">{money(pack.price, pack.currency)}</td>
                        <td>{pack.outlets.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
            <div className="project-grid">
        {cards.map((pack) => {
          const checked = picked.includes(pack.id);
          const logo = packageMark(pack, store.platforms);
          const mark = pack.group === "bundle" ? "Pk" : String(pack.rank).padStart(2, "0");
          return (
            <article key={pack.id} className="project-card">
              <Link href={`/packages/${pack.id}`} className="card-hit" aria-label={pack.name} />
              <div className="card-top">
                <span className="token-logo">{logo ? <img src={logo} alt="" /> : pack.group === "pr" ? initials("Article PR") : mark}</span>
                <div className="card-id">
                  <strong>{pack.name}</strong>
                  <div className="tiny">{pack.group === "pr" ? "Article PR" : pack.id.startsWith("mods-") ? "Mods" : pack.id === "artem-tier-1" ? "Narrative & GTM" : pack.group === "budget" ? pack.extras[0] || "Startup" : "Bundle"}</div>
                </div>
                <Pill>{pack.group === "pr" ? "Article PR" : pack.id.startsWith("mods-") ? "Mods" : pack.id === "artem-tier-1" ? "Tier 1" : pack.group === "budget" ? "Budget" : "Bundle"}</Pill>
              </div>
              <div className="card-stat">
                <div>
                  <div className="tiny">Price</div>
                  <div className="figure">{money(pack.price, pack.currency)}</div>
                </div>
                <span className="cluster lift">
                  {pack.group === "pr" && (
                    <label className="tiny compare">
                      <input type="checkbox" checked={checked} disabled={!checked && picked.length >= 3} onChange={() => toggle(pack.id)} />
                      Compare
                    </label>
                  )}
                  <button type="button" className="btn btn-small" onClick={() => ui.openAdd({ packageId: pack.id })}><Plus size={14} />Add</button>
                </span>
              </div>
              <div className="lane-grid">
                <div><span>{pack.outlets.some((item) => item.group) ? "Callers" : "Outlets"}</span><span className="num">{pack.outlets.length}</span></div>
                <div><span>Includes</span><span className="num">{pack.includes.length}</span></div>
                <div><span>Guarantees</span><span className="num">{pack.guarantees.length}</span></div>
                <div><span>Extras</span><span className="num">{pack.extras.length}</span></div>
              </div>
            </article>
          );
        })}
            </div>
            )}
          </section>
      )}
      {compared.length >= 2 && (
        <div className="table-wrap" style={{ marginTop: 22 }}>
          <table className="blotter">
            <thead><tr><th></th>{compared.map((pack) => <th key={pack.id}>{pack.name}</th>)}</tr></thead>
            <tbody>
              <tr><td>Price</td>{compared.map((pack) => <td key={pack.id}>{money(pack.price, pack.currency)}</td>)}</tr>
              <tr><td>Guarantees</td>{compared.map((pack) => <td key={pack.id}>{pack.guarantees.join(" · ")}</td>)}</tr>
              <tr><td>Named outlets</td>{compared.map((pack) => <td key={pack.id}>{pack.outlets.length}</td>)}</tr>
              <tr><td>Extras</td>{compared.map((pack) => <td key={pack.id}>{pack.extras.join(" · ") || "—"}</td>)}</tr>
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
}
