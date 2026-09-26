"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ChartLine, Cube, Globe, MagnifyingGlass, Package, Plus, Rocket, Stack, Users, type IconProps } from "@phosphor-icons/react";
import { formatUsd } from "../lib/format";
import { initials } from "../lib/logo";
import { useStore } from "../store";
import { useUi } from "../ui";
import { AddToQuote } from "./AddToQuote";

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
    const rows = [
      ...store.projects.map((item) => ({ to: `/projects/${item.id}`, kicker: "Project", title: item.name, meta: item.ticker })),
      ...store.services.map((item) => ({ to: `/catalog/${item.id}`, kicker: "Service", title: item.name, meta: item.summary })),
      ...store.packages.map((item) => ({ to: `/packages/${item.id}`, kicker: "Package", title: item.name, meta: formatUsd(item.price) })),
      ...store.providers.map((item) => ({ to: `/providers/${item.id}`, kicker: "Seller", title: item.name, meta: item.role })),
      ...store.platforms.map((item) => ({ to: `/platforms/${item.id}`, kicker: "Platform", title: item.name, meta: item.kind })),
      ...(store.contacts || []).map((item) => ({ to: `/contacts/${item.id}`, kicker: "Contact", title: item.name, meta: item.title || item.phone })),
    ];
    if (!q) return rows.slice(0, 6);
    return rows.filter((row) => `${row.title} ${row.meta}`.toLowerCase().includes(q)).slice(0, 8);
  }, [query, store.contacts, store.packages, store.platforms, store.projects, store.providers, store.services]);

  const trail = trailFor(pathname);
  const back = [...trail].reverse().find((item) => item.href);
  const plain = pathname === "/" || pathname === "/projects";

  return (
    <div className="shell">
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
          {back && <Link href={back.href!} className="btn back"><ArrowLeft size={16} />Back</Link>}
          {!plain && (
            <div className="crumb">
              {trail.map((item, index) => (
                <Fragment key={`${item.label}-${index}`}>
                  {index > 0 && <span className="crumb-sep">/</span>}
                  {item.href ? <Link href={item.href}>{item.label}</Link> : <strong>{item.label}</strong>}
                </Fragment>
              ))}
            </div>
          )}
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
                {hits.length === 0 && <div className="muted" style={{ padding: 10 }}>Nothing matches.</div>}
                {hits.map((hit) => (
                  <a key={hit.to + hit.title} href={hit.to} onMouseDown={(event) => { event.preventDefault(); router.push(hit.to); }}>
                    <div className="tiny">{hit.kicker}</div>
                    <strong>{hit.title}</strong>
                    <div className="muted">{hit.meta}</div>
                  </a>
                ))}
              </div>
            )}
          </div>
          <Link href="/projects/new" className="btn btn-primary"><Plus size={16} weight="bold" />New project</Link>
        </header>
        {children}
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

function trailFor(pathname: string): { href?: string; label: string }[] {
  if (pathname === "/") return [{ label: "Overview" }];
  if (pathname.startsWith("/projects/new")) return [{ href: "/projects", label: "Projects" }, { label: "New project" }];
  if (pathname.startsWith("/projects/")) return [{ href: "/projects", label: "Projects" }, { label: "Project" }];
  if (pathname.startsWith("/projects")) return [{ label: "Projects" }];
  if (pathname.startsWith("/contacts/")) return [{ href: "/contacts", label: "Contacts" }, { label: "Contact" }];
  if (pathname.startsWith("/contacts")) return [{ label: "Contacts" }];
  if (pathname.startsWith("/catalog/services")) return [{ href: "/catalog", label: "Catalog" }, { label: "Services" }];
  if (pathname.startsWith("/catalog/")) return [{ href: "/catalog", label: "Catalog" }, { label: "Service" }];
  if (pathname.startsWith("/catalog")) return [{ label: "Catalog" }];
  if (pathname.startsWith("/packages/")) return [{ href: "/catalog", label: "Catalog" }, { href: "/packages", label: "Packages" }, { label: "Package" }];
  if (pathname.startsWith("/packages")) return [{ href: "/catalog", label: "Catalog" }, { label: "Packages" }];
  if (pathname.startsWith("/providers/")) return [{ href: "/providers", label: "Sellers" }, { label: "Seller" }];
  if (pathname.startsWith("/providers")) return [{ label: "Sellers" }];
  if (pathname.startsWith("/platforms/")) return [{ href: "/platforms", label: "Platforms" }, { label: "Platform" }];
  if (pathname.startsWith("/platforms")) return [{ label: "Platforms" }];
  return [{ href: "/", label: "Overview" }, { label: "Page" }];
}
