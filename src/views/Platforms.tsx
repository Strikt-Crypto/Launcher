"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PlatformEditor } from "../components/editors";
import { Empty, PageHead, Pill, Select, Tabs, ViewSwitch } from "../components/ui";
import { PLATFORM_KINDS } from "../lib/labels";
import { chainLogo } from "../lib/brands";
import { initials } from "../lib/logo";
import { useStore } from "../store";
import type { PlatformKind } from "../types";

export function Platforms() {
  const store = useStore();
  const [kind, setKind] = useState<PlatformKind | "all">("all");
  const [chain, setChain] = useState("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "table">("grid");
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(params.get("new") === "1");
  useEffect(() => { if (params.get("new") === "1") setOpen(true); }, [params]);
  const close = () => { setOpen(false); if (params.get("new") === "1") router.replace("/platforms"); };
  const q = query.trim().toLowerCase();
  const chains = [...new Set(store.platforms.flatMap((platform) => platform.chains))].sort();
  const groups = PLATFORM_KINDS.filter((item) => kind === "all" || kind === item.id)
    .map((item) => ({
      ...item,
      rows: store.platforms.filter((platform) => platform.kind === item.id && (chain === "all" || platform.chains.includes(chain)) && `${platform.name} ${platform.notes} ${platform.chains.join(" ")}`.toLowerCase().includes(q)),
    }))
  const shown = groups.flatMap((group) => group.rows.map((platform) => ({ platform, kindLabel: group.label, kindShort: group.short })));

  return (
    <div className="page screen">
      <PageHead kicker="Where it launches" title="Platforms" lede="Launchpads, market terminals, wallets, and social. Pick the pad on the project." />
      <div className="tool-bar">
        <Tabs
          value={kind}
          onChange={(id) => setKind(id as PlatformKind | "all")}
          tabs={[
            { id: "all", label: "All", count: store.platforms.length },
            ...PLATFORM_KINDS.map((item) => ({ id: item.id, label: item.short, count: store.platforms.filter((platform) => platform.kind === item.id).length })),
          ]}
        />
        <div className="tool-end">
          <Select value={chain} onChange={setChain} options={[{ value: "all", label: "All chains" }, ...chains.map((name) => ({ value: name, label: name }))]} />
          <input className="input" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
          <ViewSwitch value={view} onChange={setView} />
        </div>
      </div>
      <div className="desk-fit">
      {shown.length === 0 && <Empty title="Nothing in this filter" text="Add a platform or switch the filter." />}
      {shown.length > 0 && (
        <section className="section">
          {view === "table" ? (
            <div className="table-wrap">
              <table className="blotter catalog">
                <thead><tr><th>Platform</th><th>Kind</th><th>Chains</th><th>Fee</th></tr></thead>
                <tbody>
                  {shown.map(({ platform, kindShort }) => (
                    <tr key={platform.id}>
                      <td><Link className="name-link token-cell" href={`/platforms/${platform.id}`}><span className="token-logo sm">{platform.logo ? <img src={platform.logo} alt="" /> : initials(platform.name)}</span><span><strong>{platform.name}</strong></span></Link></td>
                      <td>{kindShort}</td>
                      <td>{platform.chains.join(", ") || "Any"}</td>
                      <td>{platform.feeNote || "Open"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
          <div className="project-grid">
            {shown.map(({ platform, kindLabel, kindShort }) => (
              <Link key={platform.id} href={platform.url ? `/platforms/${platform.id}` : `/platforms/${platform.id}?edit=1`} className="project-card">
                <div className="card-top">
                  <span className="token-logo brand-mark">{platform.logo ? <img src={platform.logo} alt="" /> : initials(platform.name)}</span>
                  <div className="card-id">
                    <strong>{platform.name}</strong>
                    <div className="tiny chain-row">{platform.chains.length ? platform.chains.map((chain) => <span key={chain} className="brand-bit">{chainLogo(chain) && <img className="mark-logo" src={chainLogo(chain)} alt="" />}{chain}</span>) : "Any chain"}</div>
                  </div>
                  <Pill>{kindShort}</Pill>
                </div>
                <div className="card-stat">
                  <div>
                    <div className="tiny">Fee</div>
                    <div className="figure">{platform.feeNote || "Open"}</div>
                  </div>
                </div>
                <div className="lane-grid">
                  <div><span>Kind</span><span className="num">{kindLabel}</span></div>
                  <div><span>Chains</span><span className="num">{platform.chains.length || "Any"}</span></div>
                  <div><span>Fee</span><span className="num">{platform.feeNote || "Open"}</span></div>
                  <div><span>Link</span><span className="num">{platform.url ? "Set" : "Not set"}</span></div>
                </div>
              </Link>
            ))}
          </div>
          )}
        </section>
      )}
      </div>
      <PlatformEditor open={open} initial={null} onClose={close} />
    </div>
  );
}
