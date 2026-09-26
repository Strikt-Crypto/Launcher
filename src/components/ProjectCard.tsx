"use client";

import Link from "next/link";
import { checksByPhase } from "../lib/checks";
import { formatCompactUsd, formatDay, formatPct, tickerOf } from "../lib/format";
import { initials } from "../lib/logo";
import { PROJECT_STATUSES, launchKindOf, projectTone } from "../lib/labels";
import type { Project } from "../types";
import { MarketBoard } from "./MarketBoard";
import { Pill } from "./ui";
import { mockMarket } from "../lib/mockMarket";

export function ProjectCard({ project }: { project: Project }) {
  const kind = launchKindOf(project.launch);
  const tag = project.launch === "meme" ? "Meme" : project.utility || kind.empty;
  const phases = checksByPhase(project);
  return (
    <Link href={`/projects/${project.id}`} className="project-card">
      <div className="card-top">
        <span className="token-logo">{project.logo ? <img src={project.logo} alt="" /> : initials(project.name)}</span>
        <div className="card-id">
          <strong>{project.name}</strong>
          <div className="tiny">{tickerOf(project.ticker)} · {project.chain} · {tag}</div>
        </div>
        <Pill tone={projectTone(project.status)}>{PROJECT_STATUSES.find((item) => item.id === project.status)?.label || project.status}</Pill>
        <div className="tiny card-note">{project.notes}</div>
      </div>
      <MarketBoard id={project.id} />
      <div className="lane-grid">
        {phases.length === 0 ? <div><span>Checklist</span><span className="num">None yet</span></div> : phases.map((phase) => (
          <div key={phase.id}><span>{phase.label}</span><span className="num">{phase.done}/{phase.total}</span></div>
        ))}
        <div><span>Target</span><span className="num">{formatDay(project.targetDate)}</span></div>
      </div>
    </Link>
  );
}

export function ProjectTable({ projects }: { projects: Project[] }) {
  return (
    <div className="table-wrap">
      <table className="blotter catalog">
        <thead>
          <tr>
            <th>Token</th>
            <th>Kind</th>
            <th>Chain</th>
            <th>Status</th>
            <th>Checklist</th>
            <th>Target</th>
            <th>Market cap</th>
            <th>24h</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const market = mockMarket(project.id);
            const status = PROJECT_STATUSES.find((item) => item.id === project.status)?.label || project.status;
            const kind = launchKindOf(project.launch);
            const phases = checksByPhase(project);
            const done = phases.reduce((sum, phase) => sum + phase.done, 0);
            const total = phases.reduce((sum, phase) => sum + phase.total, 0);
            return (
              <tr key={project.id}>
                <td>
                  <Link className="name-link token-cell" href={`/projects/${project.id}`}>
                    <span className="token-logo sm">{project.logo ? <img src={project.logo} alt="" /> : initials(project.name)}</span>
                    <span><strong>{project.name}</strong><p>{tickerOf(project.ticker)}</p></span>
                  </Link>
                </td>
                <td>{project.launch === "meme" ? "Meme" : project.utility || kind.label}</td>
                <td>{project.chain}</td>
                <td><Pill tone={projectTone(project.status)}>{status}</Pill></td>
                <td>{done}/{total}</td>
                <td>{formatDay(project.targetDate)}</td>
                <td>{formatCompactUsd(market.marketCap)}</td>
                <td className={market.change24h >= 0 ? "sage" : "clay"}>{formatPct(market.change24h)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
