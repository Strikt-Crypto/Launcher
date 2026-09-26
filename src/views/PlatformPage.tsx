"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowSquareOut, PencilSimple } from "@phosphor-icons/react";
import { PlatformEditor } from "../components/editors";
import { CopyIcon, Empty } from "../components/ui";
import { href } from "../lib/format";
import { PLATFORM_KINDS, PROJECT_STATUSES, phaseOf } from "../lib/labels";
import { serviceMark } from "../lib/marks";
import { servicePriceLabel } from "../lib/price";
import { initials } from "../lib/logo";
import { useStore } from "../store";

export function PlatformPage() {
  const { id } = useParams();
  const store = useStore();
  const platform = store.platforms.find((item) => item.id === id);
  const router = useRouter();
  const params = useSearchParams();
  const [edit, setEdit] = useState(params.get("edit") === "1");
  useEffect(() => { if (params.get("edit") === "1") setEdit(true); }, [params]);
  const close = () => { setEdit(false); if (params.get("edit") === "1" && platform) router.replace(`/platforms/${platform.id}`); };
  if (!platform) return <div className="page"><Empty title="Platform missing" text="It was removed." action={<Link href="/platforms" className="btn">Platforms</Link>} /></div>;
  const services = store.services.filter((item) => item.platformIds.includes(platform.id));
  const projects = store.projects.filter((item) => item.launchpadId === platform.id);
  const kind = { launchpad: "Launchpad", market: "Market", wallet: "Wallet", social: "Social" }[platform.kind] || PLATFORM_KINDS.find((item) => item.id === platform.kind)?.label || platform.kind;
  const site = platform.url ? platform.url.replace(/^https?:\/\//, "").replace(/\/$/, "") : "";

  return (
    <div className="page screen">
      <header className="card desk-head has-mark">
        <span className="mark token-logo lg">{platform.logo ? <img src={platform.logo} alt="" /> : initials(platform.name)}</span>
        <div className="desk-copy">
          <div className="kicker">{kind}</div>
          <h1 className="display copy-line"><span>{platform.name}</span><CopyIcon text={platform.name} /></h1>
        </div>
        <div className="desk-figure">
          <div className="tiny">Projects</div>
          <div className="figure">{projects.length}</div>
        </div>
        <div className="desk-head-actions">
          {platform.url && <a className="btn" href={href(platform.url)} target="_blank" rel="noreferrer"><ArrowSquareOut size={16} />Open</a>}
          <button type="button" className="btn" onClick={() => setEdit(true)}><PencilSimple size={16} />Edit</button>
        </div>
      </header>

      <div className="desk-fit">
        <div className="offer-board four">
          <section className="card">
            <h2>Details</h2>
            <div className="price-grid">
              <div className="stat">
                <span className="stat-top"><span className="tiny">Kind</span></span>
                <b>{kind}</b>
              </div>
              <div className="stat">
                <span className="stat-top"><span className="tiny">Chains</span></span>
                <b>{platform.chains.length ? platform.chains.join(", ") : "Any"}</b>
              </div>
              {platform.feeNote ? (
                <div className="stat">
                  <span className="stat-top"><span className="tiny">Fee</span></span>
                  <span className="copy-line"><b>{platform.feeNote}</b><CopyIcon text={platform.feeNote} /></span>
                </div>
              ) : (
                <button type="button" className="stat" onClick={() => setEdit(true)}>
                  <span className="stat-top"><span className="tiny">Fee</span></span>
                  <b>Not set</b>
                </button>
              )}
              {site ? (
                <a className="stat" href={href(platform.url)} target="_blank" rel="noreferrer">
                  <span className="stat-top"><span className="tiny">Site</span></span>
                  <span className="copy-line"><b>{site}</b><CopyIcon text={platform.url} /></span>
                </a>
              ) : (
                <button type="button" className="stat" onClick={() => setEdit(true)}>
                  <span className="stat-top"><span className="tiny">Site</span></span>
                  <b>Not set</b>
                </button>
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-label"><h2>Projects</h2><b className="num">{projects.length}</b></div>
            <div className="line-fill">
              {projects.length === 0 && <p className="muted line-empty">No project is attached.</p>}
              {projects.map((item) => (
                <Link key={item.id} href={`/projects/${item.id}`} className="list-row seller-row">
                  <span className="token-logo sm">{item.logo ? <img src={item.logo} alt="" /> : initials(item.name)}</span>
                  <span>{item.name}</span>
                  <span className="tiny">{PROJECT_STATUSES.find((status) => status.id === item.status)?.label || item.status}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-label"><h2>Services</h2><b className="num">{services.length}</b></div>
            <div className="line-fill">
              {services.length === 0 && <p className="muted line-empty">No services on this platform.</p>}
              {services.map((item) => {
                const mark = serviceMark(item, store.platforms);
                return (
                  <Link key={item.id} href={`/catalog/${item.id}`} className="list-row seller-row">
                    <span className="token-logo sm">{mark ? <img src={mark} alt="" /> : initials(item.name)}</span>
                    <span>{item.name}</span>
                    <span className="tiny">{phaseOf(item.phase).label}</span>
                    <b className="num">{servicePriceLabel(item)}</b>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="card note-pad">
            <h2>Note</h2>
            <textarea className="note-field" value={platform.notes} placeholder="Write a note" onChange={(event) => store.updatePlatform(platform.id, { notes: event.target.value })} />
          </section>
        </div>
      </div>

      <PlatformEditor open={edit} initial={platform} onClose={close} />
    </div>
  );
}
