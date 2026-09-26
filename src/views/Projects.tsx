"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react";
import { ProjectCard, ProjectTable } from "../components/ProjectCard";
import { Empty, Select, Tabs, ViewSwitch } from "../components/ui";
import { LAUNCH_KINDS, PROJECT_STATUSES } from "../lib/labels";
import { useStore } from "../store";
import type { LaunchKind, ProjectStatus } from "../types";

export function Projects() {
  const store = useStore();
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [kind, setKind] = useState<LaunchKind | "all">("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "table">("grid");
  const rows = store.projects.filter((project) => {
    const hay = `${project.name} ${project.ticker} ${project.client} ${project.utility || ""}`.toLowerCase();
    return (status === "all" || project.status === status) && (kind === "all" || project.launch === kind) && hay.includes(query.trim().toLowerCase());
  });

  return (
    <div className="page screen">
      <div className="tool-bar">
        <Tabs
          value={kind}
          onChange={(id) => setKind(id as LaunchKind | "all")}
          tabs={[
            { id: "all", label: "All", count: store.projects.length },
            ...LAUNCH_KINDS.map((item) => ({ id: item.id, label: item.label, count: store.projects.filter((project) => project.launch === item.id).length })),
          ]}
        />
        <div className="tool-end">
          <Select value={status} onChange={(value) => setStatus(value as ProjectStatus | "all")} options={[{ value: "all", label: "All statuses" }, ...PROJECT_STATUSES.map((item) => ({ value: item.id, label: item.label }))]} />
          <input className="input" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
          <ViewSwitch value={view} onChange={setView} />
        </div>
      </div>
      <div className="desk-fit">
      {rows.length === 0 ? (
        <Empty title="No projects" text="Start a worksheet, or clear the filter." action={<Link className="btn btn-primary" href="/projects/new"><Plus size={16} weight="bold" />New project</Link>} />
      ) : view === "table" ? (
        <ProjectTable projects={rows} />
      ) : (
        <div className="project-grid">
          {rows.map((project) => <ProjectCard key={project.id} project={project} />)}
        </div>
      )}
      </div>
    </div>
  );
}
