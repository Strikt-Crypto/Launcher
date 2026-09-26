"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react";
import { ProjectCard, ProjectTable } from "../components/ProjectCard";
import { PageHead, Select, Tabs, ViewSwitch } from "../components/ui";
import { formatCompactUsd } from "../lib/format";
import { LAUNCH_KINDS, PROJECT_STATUSES } from "../lib/labels";
import { mockMarket } from "../lib/mockMarket";
import { useStore } from "../store";
import type { LaunchKind, ProjectStatus } from "../types";

export function Dashboard() {
  const store = useStore();
  const [tab, setTab] = useState<LaunchKind | "all">("all");
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "table">("grid");
  const q = query.trim().toLowerCase();
  const visible = store.projects.filter((project) => {
    if (status !== "all" && project.status !== status) return false;
    return `${project.name} ${project.ticker} ${project.client} ${project.utility || ""}`.toLowerCase().includes(q);
  });
  const open = store.projects.filter((project) => project.status !== "closed");
  const count = (status: ProjectStatus) => store.projects.filter((project) => project.status === status).length;
  const markets = store.projects.map((project) => mockMarket(project.id));
  const volume24h = markets.reduce((sum, market) => sum + market.volume24h, 0);
  const volumeAll = markets.reduce((sum, market) => sum + market.volumeAll, 0);
  const list = visible.filter((project) => tab === "all" || project.launch === tab);

  return (
    <div className="page">
      <PageHead
        kicker="Overview"
        title={store.settings.deskName}
        lede={`${open.length} open. Open a card to manage the launch.`}
        actions={<Link className="btn btn-primary" href="/projects/new"><Plus size={16} weight="bold" />New project</Link>}
      />
      <div className="stat-cards">
        <article className="stat-card"><span>Draft</span><strong>{count("draft")}</strong></article>
        <article className="stat-card"><span>Planning</span><strong>{count("quoted")}</strong></article>
        <article className="stat-card"><span>Ready</span><strong>{count("booked")}</strong></article>
        <article className="stat-card"><span>Live</span><strong>{count("live")}</strong></article>
        <article className="stat-card"><span>Volume 24h</span><strong>{formatCompactUsd(volume24h)}</strong></article>
        <article className="stat-card"><span>Total volume</span><strong>{formatCompactUsd(volumeAll)}</strong></article>
      </div>
      <div className="tool-bar">
        <Tabs
          value={tab}
          onChange={(id) => setTab(id as LaunchKind | "all")}
          tabs={[
            { id: "all", label: "All", count: store.projects.length },
            ...LAUNCH_KINDS.map((item) => ({
              id: item.id,
              label: item.label,
              count: store.projects.filter((project) => project.launch === item.id).length,
            })),
          ]}
        />
        <div className="tool-end">
          <Select value={status} onChange={(value) => setStatus(value as ProjectStatus | "all")} options={[{ value: "all", label: "All statuses" }, ...PROJECT_STATUSES.map((item) => ({ value: item.id, label: item.label }))]} />
          <input className="input" placeholder="Search" value={query} onChange={(event) => setQuery(event.target.value)} />
          <ViewSwitch value={view} onChange={setView} />
        </div>
      </div>
      <section className="section">
          {list.length === 0 ? (
            <p className="muted">None yet.</p>
          ) : view === "table" ? (
            <ProjectTable projects={list} />
          ) : (
            <div className="project-grid">
              {list.map((project) => <ProjectCard key={project.id} project={project} />)}
              <Link href="/projects/new" className="project-card add">
                <span className="add-mark">+</span>
                <strong>New project</strong>
              </Link>
            </div>
          )}
        </section>
    </div>
  );
}
