"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ProviderEditor } from "../components/editors";
import { CopyIcon, Empty } from "../components/ui";
import { formatUsd, href } from "../lib/format";
import { phaseOf } from "../lib/labels";
import { SocialMark } from "../components/SocialMark";
import { deskMark, packageMark, serviceMark } from "../lib/marks";
import { initials } from "../lib/logo";
import { useStore } from "../store";

export function ProviderPage() {
  const { id } = useParams();
  const store = useStore();
  const provider = store.providers.find((item) => item.id === id);
  const [edit, setEdit] = useState(false);
  if (!provider) return <div className="page"><Empty title="Seller missing" text="This seller was removed." action={<Link href="/providers" className="btn">Sellers</Link>} /></div>;
  const services = store.services.filter((item) => item.providerId === provider.id);
  const packages = store.packages.filter((item) => item.providerId === provider.id);
  const links = [
    provider.website && { label: "Site", url: href(provider.website) },
    provider.telegram && { label: "Telegram", url: href(provider.telegram) },
    provider.x && { label: "X", url: href(provider.x) },
    provider.discord && { label: "Discord", url: href(provider.discord) },
    provider.email && { label: "Email", url: href(provider.email) },
  ].filter(Boolean) as { label: string; url: string }[];

  return (
    <div className="page screen">
      <header className="card desk-head has-mark">
        <span className="mark token-logo lg">{deskMark(provider, store.platforms) ? <img src={deskMark(provider, store.platforms)} alt="" /> : initials(provider.name)}</span>
        <div className="kicker">{provider.role || "Seller"}{provider.region ? ` · ${provider.region}` : ""}</div>
        <h1 className="display copy-line"><span>{provider.name}</span><CopyIcon text={provider.name} /></h1>
        <p className="lede">{provider.about || "Add a note about how this seller works."}</p>
        <div className="desk-figure">
          <div className="tiny">Offers</div>
          <div className="figure">{services.length + packages.length}</div>
        </div>
        <div className="desk-head-actions">
          <button type="button" className="btn" onClick={() => setEdit(true)}>Edit</button>
        </div>
      </header>

      <div className="desk-fit">
      <div className="quote-layout">
        <div className="stack">
          <section className="card hold">
            <div className="spread"><h2>Services</h2><span className="tiny">{services.length}</span></div>
            <div className="line-fill">
            {services.length === 0 && <p className="muted line-empty">No services.</p>}
            {services.map((item) => {
              const mark = serviceMark(item, store.platforms);
              return (
                <Link key={item.id} href={`/catalog/${item.id}`} className="list-row seller-row">
                  <span className="token-logo sm">{mark ? <img src={mark} alt="" /> : initials(item.name)}</span>
                  <span>{item.name}</span>
                  <span className="tiny">{phaseOf(item.phase).label}</span>
                </Link>
              );
            })}
            </div>
          </section>
          <section className="card hold">
            <div className="spread"><h2>Packages</h2><span className="tiny">{packages.length}</span></div>
            <div className="line-fill">
            {packages.length === 0 && <p className="muted line-empty">No packages.</p>}
            {packages.map((item) => {
              const mark = packageMark(item, store.platforms);
              return (
                <Link key={item.id} href={`/packages/${item.id}`} className="list-row seller-row">
                  <span className="token-logo sm">{mark ? <img src={mark} alt="" /> : initials(item.name)}</span>
                  <span>{item.name}</span>
                  <b className="num">{formatUsd(item.price)}</b>
                </Link>
              );
            })}
            </div>
          </section>
        </div>

        <aside className="card offer-side">
          <dl className="facts">
            <dt>Role</dt>
            <dd>{provider.role ? <span className="copy-line"><span>{provider.role}</span><CopyIcon text={provider.role} /></span> : <button type="button" className="text-set" onClick={() => setEdit(true)}>Not set</button>}</dd>
            <dt>Region</dt>
            <dd>{provider.region ? <span className="copy-line"><span>{provider.region}</span><CopyIcon text={provider.region} /></span> : <button type="button" className="text-set" onClick={() => setEdit(true)}>Not set</button>}</dd>
            <dt>Services</dt>
            <dd>{services.length}</dd>
            <dt>Packages</dt>
            <dd>{packages.length}</dd>
          </dl>
          <div className="tiny">Links</div>
          {links.length === 0 && <button type="button" className="text-set" onClick={() => setEdit(true)}>Not set</button>}
          <div className="stack">
            {links.map((item) => (
              <span key={item.label} className="copy-line">
                <a href={item.url} target="_blank" rel="noreferrer" className="brand-bit"><SocialMark name={item.label} size={14} />{item.label}</a>
                <CopyIcon text={item.url} />
              </span>
            ))}
          </div>
        </aside>
      </div>

      </div>

      <ProviderEditor open={edit} initial={provider} onClose={() => setEdit(false)} />
    </div>
  );
}
