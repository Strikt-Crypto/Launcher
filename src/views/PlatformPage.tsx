"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowSquareOut, PencilSimple } from "@phosphor-icons/react";
import { PlatformEditor } from "../components/editors";
import { ProjectCard } from "../components/ProjectCard";
import { Empty } from "../components/ui";
import { href } from "../lib/format";
import { PLATFORM_KINDS, phaseOf } from "../lib/labels";
import { chainLogo } from "../lib/brands";
import { initials } from "../lib/logo";
import { useStore } from "../store";

export function PlatformPage() {
  const { id } = useParams();
  const store = useStore();
  const platform = store.platforms.find((item) => item.id === id);
  const [edit, setEdit] = useState(false);
  if (!platform) return <div className="page"><Empty title="Platform missing" text="It was removed." action={<Link href="/platforms" className="btn">Platforms</Link>} /></div>;
  const services = store.services.filter((item) => item.platformIds.includes(platform.id));
  const projects = store.projects.filter((item) => item.launchpadId === platform.id);
  const kind = PLATFORM_KINDS.find((item) => item.id === platform.kind)?.label || platform.kind;

  return (
    <div className="page">
      <header className="card desk-head has-mark">
        <span className="mark token-logo lg brand-mark">{platform.logo ? <img src={platform.logo} alt="" /> : initials(platform.name)}</span>
        <div className="kicker">
          <span>{kind}</span>
          {platform.chains.length ? platform.chains.map((chain) => <span key={chain} className="brand-bit">{chainLogo(chain) && <img className="mark-logo" src={chainLogo(chain)} alt="" />}{chain}</span>) : <span>Any chain</span>}
        </div>
        <h1 className="display">{platform.name}</h1>
        <p className="lede">{platform.notes || "Add a note about where this sits in a launch."}</p>
        <div className="desk-figure">
          <div className="tiny">Fee</div>
          <div className="figure">{platform.feeNote || "Open"}</div>
        </div>
        <div className="desk-head-actions">
          {platform.url && <a className="btn" href={href(platform.url)} target="_blank" rel="noreferrer"><ArrowSquareOut size={16} />Open</a>}
          <button type="button" className="btn" onClick={() => setEdit(true)}><PencilSimple size={16} />Edit</button>
        </div>
      </header>

      <div className="quote-layout service-split">
        <div className="stack">
          <section className="card hold pad-services">
            <div className="spread"><h2>Services</h2><span className="tiny">{services.length}</span></div>
            <div className="card-scroll">
            {services.length === 0 ? (
              <div className="contact-rows fill-rows">
                {["Service", "Service", "Service"].map((label, index) => (
                  <div key={index} className="spread placeholder">
                    <span className="contact-bit"><span className="token-logo sm" /><span><strong>{label}</strong><span className="tiny">Not linked</span></span></span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="outlet-grid">
                {services.map((item) => (
                  <Link key={item.id} href={`/catalog/${item.id}`}>
                    <strong>{item.name}</strong>
                    <span className="tiny">{phaseOf(item.phase).label}</span>
                  </Link>
                ))}
              </div>
            )}
            </div>
          </section>
        </div>

        <aside className="card offer-side">
          <dl className="facts">
            <dt>Kind</dt>
            <dd>{kind}</dd>
            <dt>Chains</dt>
            <dd>{platform.chains.length ? platform.chains.join(", ") : "Any"}</dd>
            <dt>Fee</dt>
            <dd>{platform.feeNote || "Open"}</dd>
            <dt>Services</dt>
            <dd>{services.length}</dd>
            <dt>Projects</dt>
            <dd>{projects.length}</dd>
          </dl>
          {platform.url && <a href={href(platform.url)} target="_blank" rel="noreferrer">{platform.url.replace(/^https?:\/\//, "")}</a>}
        </aside>
      </div>

      <section className="section">
        {projects.length === 0 ? <p className="muted">No project uses this as its launchpad.</p> : (
          <div className="project-grid">
            {projects.map((item) => <ProjectCard key={item.id} project={item} />)}
          </div>
        )}
      </section>

      <PlatformEditor open={edit} initial={platform} onClose={() => setEdit(false)} />
    </div>
  );
}
