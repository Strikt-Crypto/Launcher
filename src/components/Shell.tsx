"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ChartLine, Cube, Globe, MagnifyingGlass, Package, Plus, Rocket, Stack, Storefront, User, Users, type IconProps } from "@phosphor-icons/react";
import { formatCompactUsd, formatDay, formatPct, money, tickerOf } from "../lib/format";
import { launchKindOf, phaseOf, PLATFORM_KINDS, PROJECT_STATUSES, projectTone } from "../lib/labels";
import { initials } from "../lib/logo";
import { deskMark, packageMark, serviceMark } from "../lib/marks";
import { mockMarket } from "../lib/mockMarket";
import type { Contact, Package as OfferPackage, Platform, Project, Provider, Service } from "../types";
import { useStore } from "../store";
import { useUi } from "../ui";
import { AddToQuote } from "./AddToQuote";
import { Atmosphere } from "./Atmosphere";
import { Stage } from "./Stage";

const HIT_ICON: Record<string, ComponentType<IconProps>> = {
  Project: Rocket,
  Service: Stack,
  Package: Package,
  Seller: Storefront,
  Platform: Globe,
  Contact: User,
};

const NAV: { to: string; label: string; end?: boolean; icon: ComponentType<IconProps>; children?: { to: string; label: string; icon: ComponentType<IconProps> }[] }[] = [
  { to: "/", label: "Overview", end: true, icon: ChartLine },
  { to: "/projects", label: "Projects", icon: Rocket },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/catalog", label: "Catalog", end: true, icon: Cube, children: [
    { to: "/packages", label: "Packages", icon: Package },
    { to: "/catalog/services", label: "Services", icon: Stack },
  ] },
  { to: "/platforms", label: "Platforms", icon: Globe },
];

export function Shell({ children }: { children: ReactNode }) {
  const store = useStore();
  const ui = useUi();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    setOpen(false);
    setQuery("");
  }, [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if (event.key === "/" && !typing) {
        event.preventDefault();
        box.current?.querySelector("input")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    const providerName = (id?: string) => store.providers.find((item) => item.id === id)?.name || "";
    const rows = [
      ...store.projects.map((item) => projectHit(item)),
      ...store.services.map((item) => serviceHit(item, providerName(item.providerId), serviceMark(item, store.platforms))),
      ...store.packages.map((item) => packageHit(item, providerName(item.providerId), packageMark(item, store.platforms))),
      ...store.providers.map((item) => sellerHit(item, deskMark(item, store.platforms))),
      ...store.platforms.map((item) => platformHit(item)),
      ...(store.contacts || []).map((item) => contactHit(item)),
    ];
    const matched = q ? rows.filter((row) => row.hay.includes(q)) : rows;
    return matched.slice(0, q ? 12 : 6);
  }, [query, store.contacts, store.packages, store.platforms, store.projects, store.providers, store.services]);

  const back = backFor(pathname);
  const create = createFor(pathname);

  return (
    <div className="shell">
      <Atmosphere />
      <aside className="rail">
        <Link href="/" className="brand">
          <span className="mark">{initials(store.settings.deskName)}</span>
          <span>
            <strong>{store.settings.deskName}</strong>
            <em>ETH {store.settings.ethUsd.toLocaleString("en-US")}</em>
          </span>
        </Link>
        <nav>
          {NAV.map((item) => {
            const on = item.to === "/catalog"
              ? pathname === "/catalog" || (pathname.startsWith("/catalog/") && !pathname.startsWith("/catalog/services"))
              : item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Fragment key={item.to}>
                <Link href={item.to} className={on ? "nav-link on" : "nav-link"}><item.icon size={18} weight={on ? "fill" : "regular"} />{item.label}</Link>
                {item.children?.map((child) => {
                  const childOn = child.to === "/packages" ? pathname === "/packages" || pathname.startsWith("/packages/") : pathname === child.to || pathname.startsWith(`${child.to}/`);
                  return <Link key={child.to} href={child.to} className={childOn ? "nav-link sub on" : "nav-link sub"}><child.icon size={16} weight={childOn ? "fill" : "regular"} />{child.label}</Link>;
                })}
              </Fragment>
            );
          })}
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          {back && <Link href={back.href} className="btn back"><ArrowLeft size={16} />Back</Link>}
          <div className="search" ref={box}>
            <MagnifyingGlass className="search-icon" size={16} />
            <input
              className="input"
              placeholder="Search  /"
              value={query}
              onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onBlur={() => window.setTimeout(() => setOpen(false), 160)}
            />
            {open && (
              <div className="search-pop">
                <div className="search-scroll">
                {hits.length === 0 && <div className="muted" style={{ padding: 10 }}>Nothing matches.</div>}
                {groupHits(hits).map((group) => (
                  <div key={group.kicker}>
                    <div className="search-group">{group.label}</div>
                    {group.hits.map((hit) => {
                      const Icon = HIT_ICON[hit.kicker];
                      return (
                        <a key={hit.to} className="search-hit" href={hit.to} onMouseDown={(event) => { event.preventDefault(); router.push(hit.to); }}>
                          <span className="token-logo sm">{hit.image ? <img src={hit.image} alt="" /> : initials(hit.title)}</span>
                          <span className="search-copy">
                            <div className="search-kicker">{Icon ? <Icon size={13} /> : null}{hit.kicker}</div>
                            <strong>{hit.title}</strong>
                            {hit.facts.length > 0 && <div className="search-facts">{hit.facts.map((fact, index) => <span key={`${fact}-${index}`}>{fact}</span>)}</div>}
                            {hit.detail && <div className="search-detail">{hit.detail}</div>}
                          </span>
                          {(hit.status || hit.figure) && (
                            <span className="search-aside">
                              {hit.status && <span className={hit.tone ? `search-status ${hit.tone}` : "search-status"}>{hit.status}</span>}
                              {hit.figure && <b>{hit.figure}{hit.change && <em className={hit.changeTone}>{hit.change}</em>}</b>}
                            </span>
                          )}
                        </a>
                      );
                    })}
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>
          <Link href={create.href} className="btn btn-primary"><Plus size={16} weight="bold" />{create.label}</Link>
        </header>
        <Stage route={pathname}>{children}</Stage>
      </div>
      <AddToQuote />
      <div className="toasts">
        {ui.toasts.map((toast) => (
          <div key={toast.id} className="toast">{toast.text}</div>
        ))}
      </div>
    </div>
  );
}

type Hit = {
  to: string;
  kicker: string;
  title: string;
  image: string;
  facts: string[];
  detail: string;
  status: string;
  tone: string;
  figure: string;
  change: string;
  changeTone: string;
  hay: string;
};

const HIT_GROUP: Record<string, string> = {
  Project: "Projects",
  Service: "Services",
  Package: "Packages",
  Seller: "Sellers",
  Platform: "Platforms",
  Contact: "Contacts",
};

function hit(row: Omit<Hit, "hay">): Hit {
  const hay = [row.kicker, row.title, row.detail, row.status, row.figure, row.change, ...row.facts].join(" ").toLowerCase();
  return { ...row, hay };
}

function projectHit(item: Project): Hit {
  const status = PROJECT_STATUSES.find((entry) => entry.id === item.status)?.label || item.status;
  const kind = item.launch === "meme" ? "Meme" : item.utility || launchKindOf(item.launch).label;
  const market = mockMarket(item.id);
  return hit({
    to: `/projects/${item.id}`,
    kicker: "Project",
    title: item.name,
    image: item.logo || "",
    facts: [tickerOf(item.ticker), kind, item.chain].filter(Boolean),
    detail: item.targetDate ? `Target ${formatDay(item.targetDate)}` : "",
    status,
    tone: projectTone(item.status),
    figure: formatCompactUsd(market.marketCap),
    change: formatPct(market.change24h),
    changeTone: market.change24h >= 0 ? "sage" : "clay",
  });
}

function serviceHit(item: Service, seller: string, image: string): Hit {
  const tier = item.tiers[0];
  const price = item.openPrice ? "Open" : tier ? money(tier.price, tier.currency) : "";
  return hit({
    to: `/catalog/${item.id}`,
    kicker: "Service",
    title: item.name,
    image,
    facts: [phaseOf(item.phase).label, seller, item.chains[0] || ""].filter(Boolean),
    detail: item.summary,
    status: "",
    tone: "",
    figure: price,
    change: "",
    changeTone: "",
  });
}

function packageKind(item: OfferPackage) {
  if (item.group === "pr") return "Article PR";
  if (item.id.startsWith("mods-")) return "Mods";
  if (item.id === "artem-tier-1") return "Tier 1";
  if (item.group === "budget") return "Budget";
  return "Bundle";
}

function packageHit(item: OfferPackage, seller: string, image: string): Hit {
  return hit({
    to: `/packages/${item.id}`,
    kicker: "Package",
    title: item.name,
    image,
    facts: [packageKind(item), seller, item.outlets.length ? `${item.outlets.length} outlets` : ""].filter(Boolean),
    detail: item.summary,
    status: phaseOf(item.phase).label,
    tone: "",
    figure: money(item.price, item.currency),
    change: "",
    changeTone: "",
  });
}

function sellerHit(item: Provider, image: string): Hit {
  return hit({
    to: `/providers/${item.id}`,
    kicker: "Seller",
    title: item.name,
    image,
    facts: [item.role, item.region].filter(Boolean),
    detail: item.email || item.telegram || "",
    status: "",
    tone: "",
    figure: "",
    change: "",
    changeTone: "",
  });
}

function platformHit(item: Platform): Hit {
  const kind = PLATFORM_KINDS.find((entry) => entry.id === item.kind)?.label || item.kind;
  return hit({
    to: `/platforms/${item.id}`,
    kicker: "Platform",
    title: item.name,
    image: item.logo || "",
    facts: [kind, item.chains.join(", ") || "Any chain"].filter(Boolean),
    detail: item.feeNote || "",
    status: "",
    tone: "",
    figure: "",
    change: "",
    changeTone: "",
  });
}

function contactHit(item: Contact): Hit {
  return hit({
    to: `/contacts/${item.id}`,
    kicker: "Contact",
    title: item.name,
    image: item.image || "",
    facts: [item.title, item.company].filter(Boolean),
    detail: item.email || item.phone || "",
    status: "",
    tone: "",
    figure: "",
    change: "",
    changeTone: "",
  });
}

function groupHits(hits: Hit[]) {
  const groups: { kicker: string; label: string; hits: Hit[] }[] = [];
  for (const row of hits) {
    const last = groups[groups.length - 1];
    if (!last || last.kicker !== row.kicker) groups.push({ kicker: row.kicker, label: HIT_GROUP[row.kicker] || row.kicker, hits: [row] });
    else last.hits.push(row);
  }
  return groups;
}

function createFor(pathname: string) {
  if (pathname.startsWith("/contacts")) return { href: "/contacts/new", label: "New contact" };
  if (pathname.startsWith("/packages")) return { href: "/packages/new", label: "New package" };
  if (pathname.startsWith("/catalog")) return { href: "/catalog/new", label: "New service" };
  if (pathname.startsWith("/platforms")) return { href: "/platforms?new=1", label: "New platform" };
  if (pathname.startsWith("/providers")) return { href: "/providers?new=1", label: "New seller" };
  return { href: "/projects/new", label: "New project" };
}

function backFor(pathname: string) {
  if (pathname === "/projects/new" || /^\/projects\/[^/]+/.test(pathname)) return { href: "/projects" };
  if (pathname === "/contacts/new" || /^\/contacts\/[^/]+/.test(pathname)) return { href: "/contacts" };
  if (pathname === "/packages/new" || /^\/packages\/[^/]+/.test(pathname)) return { href: "/packages" };
  if (pathname === "/catalog/new") return { href: "/catalog/services" };
  if (/^\/catalog\/[^/]+/.test(pathname) && pathname !== "/catalog/services") return { href: "/catalog/services" };
  if (/^\/platforms\/[^/]+/.test(pathname)) return { href: "/platforms" };
  if (/^\/providers\/[^/]+/.test(pathname)) return { href: "/providers" };
  return undefined;
}
