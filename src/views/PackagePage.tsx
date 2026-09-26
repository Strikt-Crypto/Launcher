"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { Confirm, Empty } from "../components/ui";
import { byId, href, money } from "../lib/format";
import type { LinkItem, Outlet, Platform } from "../types";
import { outletMark, packageMark } from "../lib/marks";
import { useStore } from "../store";
import { useUi } from "../ui";

export function PackagePage() {
  const { id } = useParams();
  const store = useStore();
  const ui = useUi();
  const router = useRouter();
  const pack = store.packages.find((item) => item.id === id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!pack) return <div className="page"><Empty title="Package missing" text="It was removed." action={<Link href="/packages" className="btn">Packages</Link>} /></div>;
  const provider = byId(store.providers, pack.providerId);
  const family = pack.id.startsWith("supply-") ? "supply-" : pack.id.startsWith("vol-") ? "vol-" : "";
  const others = store.packages.filter((item) => item.id !== pack.id && (family ? item.id.startsWith(family) : item.group === pack.group && item.providerId === pack.providerId)).sort((a, b) => a.rank - b.rank);
  const callers = pack.outlets.some((item) => item.note);
  const logo = packageMark(pack, store.platforms);
  const mark = pack.group === "bundle" ? "Pk" : String(pack.rank).padStart(2, "0");

  return (
    <div className="page">
      <header className="card desk-head has-mark">
        <span className="mark token-logo lg">{logo ? <img src={logo} alt="" /> : mark}</span>
        <div className="kicker">{pack.group === "pr" ? `Step ${mark} · Press ladder` : pack.group === "budget" ? "Startup · Budget" : callers ? "Narrative & GTM" : "Bundle"}</div>
        <h1 className="display">{pack.name}</h1>
        <p className="lede">{pack.summary}</p>
        <div className="desk-figure">
          <div className="tiny">Price</div>
          <div className="figure">{money(pack.price, pack.currency)}</div>
        </div>
        <div className="desk-head-actions">
          <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)}><Trash size={16} />Delete</button>
          <Link className="btn" href={`/packages/${pack.id}/edit`}><PencilSimple size={16} />Edit</Link>
          <button type="button" className="btn btn-primary" onClick={() => ui.openAdd({ packageId: pack.id })}><Plus size={16} weight="bold" />Add to project</button>
        </div>
      </header>

      <div className="pack-facts">
        <article>
          <span>Seller</span>
          {provider ? <Link href={`/providers/${provider.id}`}><strong>{provider.name}</strong></Link> : <strong>Unassigned</strong>}
        </article>
        <article><span>Price</span><strong>{money(pack.price, pack.currency)}</strong></article>
        <article><span>{callers ? "Callers" : "Outlets"}</span><strong>{pack.outlets.length}</strong></article>
        <article><span>Deliverables</span><strong>{pack.includes.length}</strong></article>
        <article><span>Guarantees</span><strong>{pack.guarantees.length}</strong></article>
      </div>

      <div className="pack-board">
        {pack.guarantees.length > 0 && (
          <section className="card hold">
            <h2>Guarantee</h2>
            <div className="card-scroll"><div className="row-list">{pack.guarantees.map((item) => <div key={item}><span>{item}</span></div>)}</div></div>
          </section>
        )}
        {pack.extras.length > 0 && (
          <section className="card hold">
            <h2>Terms</h2>
            <div className="card-scroll"><div className="row-list">{pack.extras.map((item) => <div key={item}><span>{item}</span></div>)}</div></div>
          </section>
        )}
        {pack.includes.length > 0 && (
          <section className="card hold">
            <h2>Deliverables</h2>
            <div className="card-scroll"><div className="outlet-grid">
              {pack.includes.map((item) => {
                const icon = outletMark(item.label, item.url, store.platforms);
                const body = <span className="brand-bit">{icon && <img className="mark-logo" src={icon} alt="" />}<strong>{item.label}</strong>{item.note ? <span className="tiny">{item.note}</span> : null}</span>;
                return item.url
                  ? <a key={item.label} href={href(item.url)} target="_blank" rel="noreferrer">{body}</a>
                  : <span key={item.label} className="outlet">{body}</span>;
              })}
            </div></div>
          </section>
        )}
      </div>

      {pack.outlets.length > 0 && !callers && (
        <section className="section">
          <div className="spread"><h2>Outlets</h2><span className="tiny">{pack.outlets.length}</span></div>
          <div className="outlet-grid">
            {pack.outlets.map((item) => {
              const icon = outletMark(item.name, item.url, store.platforms);
              const body = <span className="brand-bit">{icon && <img className="mark-logo" src={icon} alt="" />}{item.name}</span>;
              return item.url
                ? <a key={item.name} href={href(item.url)} target="_blank" rel="noreferrer">{body}</a>
                : <span key={item.name} className="outlet">{body}</span>;
            })}
          </div>
        </section>
      )}
      {callers && <Callers outlets={pack.outlets} platforms={store.platforms} />}

      {others.length > 0 && (
        <section className="section">
          <div className="project-grid">
            {others.map((item) => (
              <Link key={item.id} href={`/packages/${item.id}`} className="project-card">
                <div className="card-top">
                  <span className="token-logo">{packageMark(item, store.platforms) ? <img src={packageMark(item, store.platforms)} alt="" /> : item.group === "bundle" ? "Pk" : String(item.rank).padStart(2, "0")}</span>
                  <div className="card-id">
                    <strong>{item.name}</strong>
                    <div className="tiny">{item.summary}</div>
                  </div>
                </div>
                <div className="card-stat">
                  <div>
                    <div className="tiny">Price</div>
                    <div className="figure">{money(item.price, item.currency)}</div>
                  </div>
                </div>
                <div className="lane-grid">
                  <div><span>Outlets</span><span className="num">{item.outlets.length}</span></div>
                  <div><span>Includes</span><span className="num">{item.includes.length}</span></div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Confirm open={confirmDelete} title={`Delete ${pack.name}?`} text="Projects that already copied this package keep their rows." confirm="Delete" onConfirm={() => { store.deletePackage(pack.id); router.push("/packages"); }} onClose={() => setConfirmDelete(false)} />
    </div>
  );
}

function profileLabel(url: string) {
  try {
    const host = new URL(url).host.replace(/^www\./, "");
    if (host === "fomo.family") return "FOMO";
    if (host === "pump.fun") return "Pump.fun";
    if (host === "x.com" || host === "twitter.com") return "X";
    return host;
  } catch {
    return "Profile";
  }
}

function profileLinks(item: Outlet): LinkItem[] {
  if (item.links?.length) return item.links;
  return item.url ? [{ label: profileLabel(item.url), url: item.url }] : [];
}

function Callers({ outlets, platforms }: { outlets: Outlet[]; platforms: Platform[] }) {
  const groups = [...new Set(outlets.map((item) => item.group || "Callers"))];
  return (
    <>
      {groups.map((group) => (
        <section key={group} className="section">
          <div className="caller-grid">
            {outlets.filter((item) => (item.group || "Callers") === group).map((item) => {
              const icon = outletMark(item.name, item.url, platforms);
              const links = profileLinks(item);
              return (
                <article key={item.name} className="social-card">
                  <div className="spread">
                    <span className="token-logo">{icon ? <img src={icon} alt="" /> : item.name.slice(0, 2)}</span>
                  </div>
                  <div className="card-id">
                    <strong>{item.name}</strong>
                    {item.note ? <div className="tiny">{item.note}</div> : null}
                  </div>
                  {links.length > 0 && (
                    <div className="chain-row">
                      {links.map((link) => {
                        const mark = outletMark(link.label, link.url, platforms);
                        return (
                          <a key={link.url} className="brand-bit" href={href(link.url)} target="_blank" rel="noreferrer">
                            {mark && <img className="mark-logo" src={mark} alt="" />}
                            {link.label}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
