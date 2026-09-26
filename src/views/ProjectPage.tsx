"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { BriefEditor, DiscountEditor, LineEditor, SocialEditor, WalletEditor } from "../components/editors";
import { SupplyPicker } from "../components/SupplyPicker";
import { MarketBoard } from "../components/MarketBoard";
import { Confirm, Donut, Empty, Menu, Modal, PhaseBars, Pill, Select, Tabs } from "../components/ui";
import { cloneProject } from "../lib/clone";
import { byId, formatDay, formatUsd, href, money, shortAddress, tickerOf } from "../lib/format";
import { uid } from "../lib/id";
import { BILLING, LAUNCH_KINDS, LINE_STATUSES, PHASE_COLOR, PROJECT_STATUSES, WORK_LANES, launchKindOf, phaseOf } from "../lib/labels";
import { checksInPhase } from "../lib/checks";
import { chainLogo, socialLogo } from "../lib/brands";
import { initials, readAsset, readLogo } from "../lib/logo";
import { projectQuote } from "../lib/quote";
import { useStore } from "../store";
import { useUi } from "../ui";
import { Copy, DownloadSimple, LinkSimple, Plus, Trash } from "@phosphor-icons/react";
import type { AssetPack, BillingStatus, Contact, LaunchKind, LineItem, LineStatus, PhaseId, SocialAccount, SupplyPct, SupplyRoute, TreasuryKey, Wallet } from "../types";

export function ProjectPage() {
  const { id } = useParams();
  const store = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const project = store.projects.find((item) => item.id === id);
  const tab = params.get("tab") || "desk";
  const [discountOpen, setDiscountOpen] = useState(false);
  const [line, setLine] = useState<LineItem | null | undefined>(undefined);
  const [walletEdit, setWalletEdit] = useState<Wallet | null | undefined>(undefined);
  const [socialEdit, setSocialEdit] = useState<SocialAccount | null | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!project) {
    return <div className="page"><Empty title="Project missing" text="It may have been deleted." action={<Link className="btn" href="/projects">Back to projects</Link>} /></div>;
  }

  const pad = byId(store.platforms, project.launchpadId);
  const done = project.checks.filter((check) => check.done).length;

  return (
    <div className="page">
      <header className="card desk-head has-mark">
        <label className="mark token-logo lg">
          {project.logo ? <img src={project.logo} alt="" /> : initials(project.name)}
          <input type="file" accept="image/*" hidden onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            store.updateProject(project.id, { logo: await readLogo(file) });
          }} />
        </label>
        <div className="desk-copy">
          <div className="kicker">
            <span>{tickerOf(project.ticker)}</span>
            <span className="brand-bit">{chainLogo(project.chain) && <img className="mark-logo" src={chainLogo(project.chain)} alt="" />}{project.chain}</span>
            <span className="brand-bit">{pad?.logo && <img className="mark-logo" src={pad.logo} alt="" />}{pad?.name || "On-chain"}</span>
          </div>
          <h1 className="display">{project.name}</h1>
          <div className="desk-token">
            <div><span className="tiny">Contract</span><span className="mono" title={project.contract}>{shortAddress(project.contract)}</span></div>
            <div><span className="tiny">Supply</span><span title={project.supply}>{project.supply || "—"}</span></div>
            <div><span className="tiny">Owner</span><span>{project.client || "—"}</span></div>
            <div><span className="tiny">Target</span><span>{formatDay(project.targetDate)}</span></div>
          </div>
          <div className="desk-meta cluster">
            <Select tight value={project.launch || "meme"} onChange={(value) => store.updateProject(project.id, { launch: value as LaunchKind, utility: value === "meme" ? "" : project.utility })} options={LAUNCH_KINDS.map((item) => ({ value: item.id, label: item.group }))} />
            {project.launch !== "meme" && (
              <input className="input" style={{ maxWidth: 240 }} value={project.utility || ""} placeholder={launchKindOf(project.launch).note} onChange={(e) => store.updateProject(project.id, { utility: e.target.value })} />
            )}
            <Select tight value={project.status} onChange={(value) => store.updateProject(project.id, { status: value as typeof project.status })} options={PROJECT_STATUSES.map((item) => ({ value: item.id, label: item.label }))} />
          </div>
        </div>
        <div className="desk-head-actions">
          <button type="button" className="btn" onClick={() => router.push(`/projects/${project.id}?tab=brief`)}>Edit token</button>
          <Menu items={[
            { label: "Duplicate", onClick: () => { const copy = cloneProject(project); store.addProject(copy); router.push(`/projects/${copy.id}`); } },
            { label: "Delete", danger: true, onClick: () => setConfirmDelete(true) },
          ]} />
        </div>
      </header>
      <Tabs
        className="full"
        value={tab}
        onChange={(next) => router.push(`/projects/${project.id}?tab=${next}`)}
        tabs={[
          { id: "desk", label: "Project" },
          { id: "brief", label: "Details" },
          { id: "wallets", label: "Hot wallets", count: project.wallets.length },
          { id: "socials", label: "Socials", count: project.socials?.length || 0 },
          { id: "contacts", label: "Contacts", count: project.contactIds?.length || 0 },
          { id: "quote", label: "Plan", count: project.lineItems.length },
          { id: "checks", label: "Checklist", count: project.checks.length - done },
          { id: "flow", label: "Money" },
          { id: "statement", label: "Summary" },
        ]}
      />
      {tab === "desk" && <Desk projectId={project.id} onWallet={() => setWalletEdit(null)} onEditLine={(row) => setLine(row)} />}
      {tab === "brief" && <Brief projectId={project.id} />}
      {tab === "wallets" && <Wallets projectId={project.id} onAdd={() => setWalletEdit(null)} onEdit={(row) => setWalletEdit(row)} />}
      {tab === "socials" && <Socials projectId={project.id} onAdd={() => setSocialEdit(null)} onEdit={(row) => setSocialEdit(row)} />}
      {tab === "contacts" && <People projectId={project.id} />}
      {tab === "quote" && <Quote projectId={project.id} onDiscount={() => setDiscountOpen(true)} onEdit={(row) => setLine(row)} onCustom={() => setLine(null)} />}
      {tab === "checks" && <Checks projectId={project.id} />}
      {tab === "flow" && <Flow projectId={project.id} />}
      {tab === "statement" && <Statement projectId={project.id} />}
      <DiscountEditor open={discountOpen} project={project} onClose={() => setDiscountOpen(false)} />
      <LineEditor open={line !== undefined} project={project} line={line ?? null} onClose={() => setLine(undefined)} />
      <WalletEditor open={walletEdit !== undefined} project={project} wallet={walletEdit ?? null} onClose={() => setWalletEdit(undefined)} />
      <SocialEditor open={socialEdit !== undefined} project={project} social={socialEdit ?? null} onClose={() => setSocialEdit(undefined)} />
      {confirmDelete && (
        <div className="modal-back" onMouseDown={() => setConfirmDelete(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <h2>Delete {project.name}?</h2>
            <p className="muted">The plan and checklist go with it.</p>
            <div className="cluster" style={{ marginTop: 12 }}>
              <button type="button" className="btn btn-danger" onClick={() => { store.deleteProject(project.id); router.push("/projects"); }}>Delete</button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function useProject(id: string) {
  const store = useStore();
  const project = store.projects.find((item) => item.id === id);
  if (!project) throw new Error("missing");
  return { store, project };
}

function Desk({ projectId, onWallet, onEditLine }: { projectId: string; onWallet: () => void; onEditLine: (line: LineItem) => void }) {
  const { store, project } = useProject(projectId);
  const ui = useUi();
  const quote = projectQuote(project, store.settings);
  const [openLane, setOpenLane] = useState<PhaseId | null>(null);
  const active = WORK_LANES.find((lane) => lane.id === openLane);

  return (
    <div className="stack">
      <div className="lane-board">
        {WORK_LANES.map((lane) => {
          const rows = quote.rows.filter((row) => row.line.phase === lane.id);
          const checks = checksInPhase(project, lane.id);
          const done = checks.filter((check) => check.done).length;
          return (
            <button key={lane.id} type="button" className={openLane === lane.id ? "lane-tile on" : "lane-tile"} onClick={() => setOpenLane(openLane === lane.id ? null : lane.id)}>
              <div className="spread">
                <span className="tiny">{lane.n} · {lane.label}</span>
                <span className="tiny">Checklist</span>
              </div>
              <div className="figure">{done}/{checks.length}</div>
              <p className="muted">{lane.hint}</p>
              <div className="lane-preview">
                {rows.slice(0, 3).map(({ line, gross }) => (
                  <div key={line.id}><span>{line.name}</span><span className="num">{money(gross, line.currency)}</span></div>
                ))}
                {rows.length === 0 && <div><span>Nothing posted</span><span /></div>}
                {rows.length > 3 && <div><span>+{rows.length - 3} more</span><span /></div>}
              </div>
            </button>
          );
        })}
      </div>
      {active && (
        <section className="card lane-open">
          <div className="spread">
            <h2>{active.n} · {active.label}</h2>
            <button type="button" className="btn btn-small" onClick={() => setOpenLane(null)}>Close</button>
          </div>
          <LaneBody lane={active} projectId={project.id} onWallet={onWallet} onEditLine={onEditLine} onAdd={() => ui.openAdd({ projectId: project.id, phase: active.id })} />
        </section>
      )}
    </div>
  );
}

function LaneBody({ lane, projectId, onWallet, onAdd, onEditLine }: { lane: (typeof WORK_LANES)[number]; projectId: string; onWallet: () => void; onAdd: () => void; onEditLine: (line: LineItem) => void }) {
  const { store, project } = useProject(projectId);
  const quote = projectQuote(project, store.settings);
  const t = project.treasury;
  const set = (patch: Partial<typeof t>) => store.updateProject(project.id, { treasury: { ...t, ...patch } });
  const posted = (key: TreasuryKey) => project.lineItems.some((line) => line.meta?.treasuryKey === key);
  const rows = quote.rows.filter((row) => row.line.phase === lane.id);

  return (
    <div className="stack">
      <div className="spread">
        <p className="muted">{lane.hint}</p>
        <button type="button" className="btn btn-small" onClick={onAdd}>Add</button>
      </div>
      {rows.length === 0 ? <p className="muted">Nothing posted in this lane.</p> : rows.map(({ line, gross }) => (
        <button key={line.id} type="button" className="line-row" onClick={() => onEditLine(line)}>
          <strong>{line.name}</strong>
          <span className="tiny">{line.detail || "—"}</span>
          <span className="num">{money(gross, line.currency)}</span>
        </button>
      ))}
      {lane.id === "prelaunch" && (
              <div className="inner-card form-grid">
                <FieldLike label="Pre-launch budget EUR" value={t.marketingPreEur} onChange={(value) => set({ marketingPreEur: value })} />
                <div className="field"><span className="label">Plan</span><button type="button" className="btn" onClick={() => store.postTreasury(project.id, "mkt-pre")}>{posted("mkt-pre") ? "Update pre-launch" : "Post pre-launch"}</button></div>
              </div>
            )}
            {lane.id === "phase-1" && (
              <div className="inner-card form-grid">
                <FieldLike label="Phase 1 marketing EUR" value={t.marketingPhase1Eur} onChange={(value) => set({ marketingPhase1Eur: value })} />
                <div className="field"><span className="label">Plan</span><button type="button" className="btn" onClick={() => store.postTreasury(project.id, "mkt-p1")}>{posted("mkt-p1") ? "Update phase 1" : "Post phase 1 budget"}</button></div>
              </div>
            )}
            {lane.id === "startup" && (
              <div className="inner-card stack">
                <div className="form-grid">
                  <FieldLike label="Launch fee ETH" value={t.launchFeeEth} onChange={(value) => set({ launchFeeEth: value })} />
                  <label className="field"><span className="label">Fee label</span><input className="input" value={t.launchFeeLabel} onChange={(e) => set({ launchFeeLabel: e.target.value })} /></label>
                  <label className="field span-2"><span className="label">Hot wallets</span><input className="input" value={t.hotWalletsNote} onChange={(e) => set({ hotWalletsNote: e.target.value })} /></label>
                  <FieldLike label="Volume budget USD" value={t.volumeBudgetUsd} onChange={(value) => set({ volumeBudgetUsd: value })} />
                  <label className="field"><span className="label">Volume target</span><input className="input" value={t.volumeTarget} onChange={(e) => set({ volumeTarget: e.target.value })} /></label>
                  <FieldLike label="MM budget USD" value={t.mmBudgetUsd} onChange={(value) => set({ mmBudgetUsd: value })} />
                  <FieldLike label="MM USD / week" value={t.mmWeeklyUsd} onChange={(value) => set({ mmWeeklyUsd: value })} />
                  <FieldLike label="MM weeks" value={t.mmWeeks} onChange={(value) => set({ mmWeeks: value })} />
                </div>
                <SupplyPicker pct={t.supplyPct} route={t.route} ethUsd={store.settings.ethUsd} onChange={(pct: SupplyPct, route: SupplyRoute) => set({ supplyPct: pct, route })} />
                <div className="cluster">
                  <button type="button" className="btn btn-small" onClick={onWallet}>Add hot wallet</button>
                  {(["pons", "supply", "volume", "mm-budget", "mm-weeks"] as TreasuryKey[]).map((key) => (
                    <button key={key} type="button" className="btn btn-small" onClick={() => store.postTreasury(project.id, key)}>{posted(key) ? `Update ${key}` : `Post ${key}`}</button>
                  ))}
                </div>
                {project.wallets.map((wallet) => (
                  <div key={wallet.id} className="spread"><span>{wallet.label}<span className="tiny"> {wallet.purpose}</span></span><span className="mono">{wallet.address || "TBD"}</span></div>
                ))}
              </div>
      )}
    </div>
  );
}

function Brief({ projectId }: { projectId: string }) {
  const { store, project } = useProject(projectId);
  const pad = byId(store.platforms, project.launchpadId);
  const providers = [...new Set(project.lineItems.map((line) => line.providerId).filter(Boolean))] as string[];
  return (
    <div className="stack">
      {project.sample && <div className="callout">This is the sample worksheet.</div>}
      <div className="spread">
        <span className="tiny">The fields below are the token. The sellers stay beside them.</span>
        {project.sample && <button type="button" className="btn" onClick={() => store.updateProject(project.id, { sample: false })}>Working project</button>}
      </div>
      <div className="brief-layout">
        <div className="stack">
          <section className="card identity-card">
            <h2>Identity</h2>
            <div className="identity-grid">
              <div><span className="tiny">Owner</span><strong>{project.client || "—"}</strong></div>
              <div><span className="tiny">Chain</span><strong className="brand-bit">{chainLogo(project.chain) && <img className="mark-logo" src={chainLogo(project.chain)} alt="" />}{project.chain || "—"}</strong></div>
              <div><span className="tiny">Launchpad</span><strong>{pad ? <Link href={`/platforms/${pad.id}`} className="brand-bit">{pad.logo && <img className="mark-logo" src={pad.logo} alt="" />}{pad.name}</Link> : "—"}</strong></div>
              <div><span className="tiny">Target</span><strong>{formatDay(project.targetDate)}</strong></div>
              <div><span className="tiny">Budget</span><strong>{project.budgetUsd ? formatUsd(project.budgetUsd) : "Not set"}</strong></div>
              <div><span className="tiny">Supply</span><strong>{project.supply || "—"}</strong></div>
              <div className="span-2"><span className="tiny">Contract</span><strong className="mono">{project.contract || "—"}</strong></div>
            </div>
            <MarketBoard id={project.id} />
            {project.notes && <p className="muted identity-note">{project.notes}</p>}
          </section>
          <BriefEditor embedded project={project} onClose={() => undefined} />
        </div>
        <div className="stack brief-side">
          <div className="card hold">
            <div className="tiny">Sellers on this plan</div>
            <div className="card-scroll stack">
            {providers.length === 0 && <p className="muted">Add a line and the seller shows up here.</p>}
            {providers.map((id) => {
              const provider = byId(store.providers, id);
              return provider ? <Link key={id} href={`/providers/${id}`}><strong>{provider.name}</strong><div className="tiny">{provider.role}</div></Link> : null;
            })}
            </div>
          </div>
          <PackBoard kind="logo" projectId={project.id} />
          <PackBoard kind="banner" projectId={project.id} />
        </div>
      </div>
    </div>
  );
}

function PackBoard({ kind, projectId }: { kind: "logo" | "banner"; projectId: string }) {
  const { store, project } = useProject(projectId);
  const key = kind === "logo" ? "logoPacks" : "bannerPacks";
  const packs = project[key] || [];
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [files, setFiles] = useState<AssetPack["files"]>([]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");
  const [drop, setDrop] = useState<string | null>(null);

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    try {
      const next: AssetPack["files"] = [];
      for (const file of [...list].slice(0, 8)) {
        const data = await readAsset(file, kind === "logo" ? 800 : 1600);
        const base = file.name.replace(/\.[^.]+$/, "") || file.name;
        next.push({ id: uid("file"), name: base, data });
      }
      setFiles((current) => [...current, ...next].slice(0, 8));
    } finally {
      setBusy(false);
    }
  }

  function save() {
    if (!name.trim() && !link.trim() && files.length === 0) return;
    const pack: AssetPack = { id: uid("pack"), name: name.trim() || (kind === "logo" ? "Logo pack" : "Banner pack"), link: link.trim(), files };
    store.updateProject(project.id, { [key]: [...packs, pack] });
    setOpen(false);
    setName("");
    setLink("");
    setFiles([]);
  }

  async function copyLink(pack: AssetPack) {
    if (!pack.link) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(pack.link);
      ok = true;
    } catch {
      const input = document.createElement("textarea");
      input.value = pack.link;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.select();
      ok = document.execCommand("copy");
      input.remove();
    }
    if (!ok) return;
    setCopied(pack.id);
    window.setTimeout(() => setCopied((current) => (current === pack.id ? "" : current)), 1200);
  }

  return (
    <section className={`card asset-card ${kind}`}>
      <div className="spread">
        <h2>{kind === "logo" ? "Logo packs" : "Banner packs"}</h2>
        <button type="button" className="btn btn-small" onClick={() => setOpen((value) => !value)}><Plus size={14} />Add</button>
      </div>
      <p className="tiny">Download the files, or share the link, so a service can use them.</p>
      {open && (
        <div className="stack asset-form">
          <label className="field"><span className="label">Name</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === "logo" ? "Square set" : "Launch banners"} /></label>
          <label className="field"><span className="label">Share link</span><input className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" /></label>
          <label className="field"><span className="label">Files</span><input className="input" type="file" accept="image/*" multiple onChange={(e) => { void onFiles(e.target.files); e.target.value = ""; }} /></label>
          {files.length > 0 && <div className="asset-files">{files.map((file) => <img key={file.id} src={file.data} alt="" />)}</div>}
          <div className="cluster">
            <button type="button" className="btn btn-primary btn-small" disabled={busy || (!name.trim() && !link.trim() && files.length === 0)} onClick={save}>{busy ? "Reading" : "Save pack"}</button>
            <button type="button" className="btn btn-small" onClick={() => { setOpen(false); setFiles([]); }}>Cancel</button>
          </div>
        </div>
      )}
      <div className="card-scroll stack">
        {packs.length === 0 && <p className="muted">No {kind === "logo" ? "logo" : "banner"} pack yet.</p>}
        {packs.map((pack) => (
          <div key={pack.id} className="asset-row">
            <div>
              <strong>{pack.name}</strong>
              <div className="tiny">{pack.files.length} {pack.files.length === 1 ? "file" : "files"}{pack.link ? " · link" : ""}</div>
            </div>
            {pack.files.length > 0 && (
              <div className="asset-files">
                {pack.files.map((file) => (
                  <a key={file.id} href={file.data} download={`${pack.name}-${file.name}.jpg`} title={file.name}>
                    <img src={file.data} alt="" />
                  </a>
                ))}
              </div>
            )}
            <div className="cluster">
              {pack.files.map((file) => (
                <a key={file.id} className="btn btn-small" href={file.data} download={`${pack.name}-${file.name}.jpg`}><DownloadSimple size={14} />{file.name}</a>
              ))}
              {pack.link && (
                <>
                  <button type="button" className="btn btn-small" onClick={() => void copyLink(pack)}><Copy size={14} />{copied === pack.id ? "Copied" : "Copy link"}</button>
                  <a className="btn btn-small" href={href(pack.link)} target="_blank" rel="noreferrer"><LinkSimple size={14} />Open</a>
                </>
              )}
              <button type="button" className="btn btn-small btn-danger" onClick={() => setDrop(pack.id)}><Trash size={14} />Remove</button>
            </div>
          </div>
        ))}
      </div>
      <Confirm open={drop !== null} title="Remove this pack?" text="The files and the share link leave this token." confirm="Remove" onClose={() => setDrop(null)} onConfirm={() => { store.updateProject(project.id, { [key]: packs.filter((pack) => pack.id !== drop) }); setDrop(null); }} />
    </section>
  );
}

function Quote({ projectId, onDiscount, onEdit, onCustom }: { projectId: string; onDiscount: () => void; onEdit: (line: LineItem) => void; onCustom: () => void }) {
  const { store, project } = useProject(projectId);
  const ui = useUi();
  const quote = projectQuote(project, store.settings);
  const [dropLine, setDropLine] = useState<LineItem | null>(null);
  return (
    <div className="stack">
      <div className="cluster">
        <button type="button" className="btn btn-primary" onClick={() => ui.openAdd({ projectId: project.id })}>Add from catalog</button>
        <button type="button" className="btn" onClick={onCustom}>Custom row</button>
      </div>
      <div className="quote-layout">
      {project.lineItems.length === 0 ? <Empty title="Nothing planned" text="Add a service, a package, or a custom row." /> : (
        <div className="table-wrap">
          <table className="blotter">
            <thead>
              <tr><th>Item</th><th>Phase</th><th>Seller</th><th>Status</th><th>Payment</th><th className="num">Amount</th><th></th></tr>
            </thead>
            <tbody>
              {quote.rows.map(({ line, gross, usd }) => (
                <tr key={line.id}>
                  <td>
                    <button type="button" className="row-hit" onClick={() => onEdit(line)}>
                      <strong>{line.name}</strong>
                      <div className="tiny">{line.detail}{line.unitPrice === 0 ? " · Price open" : ""}</div>
                    </button>
                  </td>
                  <td>{phaseOf(line.phase).label}</td>
                  <td>{byId(store.providers, line.providerId)?.name || "—"}</td>
                  <td>
                    <Select tight value={line.status} onChange={(value) => store.updateLine(project.id, line.id, { status: value as LineStatus })} options={LINE_STATUSES.map((item) => ({ value: item.id, label: item.label }))} />
                  </td>
                  <td>
                    <Select tight value={line.billing} onChange={(value) => store.updateLine(project.id, line.id, { billing: value as BillingStatus })} options={BILLING.map((item) => ({ value: item.id, label: item.label }))} />
                  </td>
                  <td className="figure-cell">
                    {money(gross, line.currency)}
                    {line.currency !== "USD" && <div className="tiny">{formatUsd(usd)}</div>}
                  </td>
                  <td>
                    <Menu items={[
                      { label: "Edit", onClick: () => onEdit(line) },
                      { label: "Move up", onClick: () => store.moveLine(project.id, line.id, -1) },
                      { label: "Move down", onClick: () => store.moveLine(project.id, line.id, 1) },
                      { label: "Remove", danger: true, onClick: () => setDropLine(line) },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="card">
        {quote.mixed && quote.native.map((row) => (
          <div key={row.currency} className="spread"><span>{row.currency}</span><span>{money(row.amount, row.currency)}</span></div>
        ))}
        <label className="field">
          <span className="label">Budget</span>
          <input className="input" value={project.budgetUsd} onChange={(e) => store.updateProject(project.id, { budgetUsd: Number(e.target.value) || 0 })} />
        </label>
        <div className="spread"><span>Subtotal</span><span>{formatUsd(quote.subtotalUsd)}</span></div>
        <button type="button" className="spread" style={{ width: "100%", background: "none", border: 0, padding: 0 }} onClick={onDiscount}>
          <span className="clay">Discount {project.discountNote ? `· ${project.discountNote}` : ""}</span>
          <span className="clay">−{formatUsd(quote.discountUsd)}</span>
        </button>
        <div className="spread"><span>Paid</span><span>{formatUsd(quote.paidUsd)}</span></div>
        <div className="fall-total spread"><span>Remaining</span><span>{formatUsd(quote.balanceUsd)}</span></div>
        <p className="tiny">Paid is what has already been settled. Remaining is the plan minus paid and comped rows.</p>
      </div>
      </div>
      <Confirm
        open={dropLine != null}
        title={dropLine ? `Remove ${dropLine.name}?` : "Remove row?"}
        text="The row leaves this plan. You can add it again from the catalog."
        onConfirm={() => { if (dropLine) store.removeLine(project.id, dropLine.id); setDropLine(null); }}
        onClose={() => setDropLine(null)}
      />
    </div>
  );
}

function coverage(store: { packages: { id: string; providerId: string }[]; services: { id: string; providerId: string; kind: string; available: boolean }[] }, project: { lineItems: { refId?: string }[] }, contact: Contact) {
  const ids = [
    ...store.packages.filter((pack) => contact.providerId && pack.providerId === contact.providerId).map((pack) => pack.id),
    ...store.services.filter((service) => contact.providerId && service.providerId === contact.providerId && service.kind === "service" && service.available).map((service) => service.id),
  ];
  const posted = new Set(project.lineItems.map((line) => line.refId));
  const on = ids.filter((id) => posted.has(id)).length;
  return { on, open: ids.length - on };
}

function People({ projectId }: { projectId: string }) {
  const { store, project } = useProject(projectId);
  const [pick, setPick] = useState(false);
  const [query, setQuery] = useState("");
  const [drop, setDrop] = useState<Contact | null>(null);
  const ids = project.contactIds || [];
  const people = ids.map((id) => (store.contacts || []).find((item) => item.id === id)).filter((item): item is Contact => Boolean(item));
  const q = query.trim().toLowerCase();
  const available = (store.contacts || []).filter((contact) => {
    if (ids.includes(contact.id)) return false;
    if (!q) return true;
    return `${contact.name} ${contact.title} ${contact.phone} ${contact.company}`.toLowerCase().includes(q);
  });

  return (
    <div className="stack">
      <div className="check-controls">
        <div className="spread">
          <div>
            <strong>People</strong>
            <p className="tiny">A contact brings their packages and services. On the plan is already posted. Still open is what this token does not have yet.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => { setQuery(""); setPick(true); }}>Add contact</button>
        </div>
      </div>
      {people.length === 0 && <p className="muted">No one on this project yet. Add a person from the contact book, or create one here.</p>}
      <div className="project-grid">
        {people.map((contact) => (
          <article key={contact.id} className="project-card">
            <Link href={`/contacts/${contact.id}`} className="card-hit" aria-label={contact.name} />
            <div className="card-top">
              <span className="token-logo">{contact.image ? <img src={contact.image} alt="" /> : initials(contact.name)}</span>
              <div className="card-id">
                <strong>{contact.name}</strong>
                <div className="tiny">{contact.title || "No title"}{contact.company ? ` · ${contact.company}` : ""}</div>
              </div>
              <button type="button" className="btn btn-small lift" onClick={() => setDrop(contact)}>Remove</button>
            </div>
            <div className="lane-grid">
              <div><span>Email</span><span className="num">{contact.email || "—"}</span></div>
              <div><span>Company</span><span className="num">{contact.company || "—"}</span></div>
              <div><span>On the plan</span><span className="num">{coverage(store, project, contact).on}</span></div>
              <div><span>Still open</span><span className="num">{coverage(store, project, contact).open}</span></div>
            </div>
          </article>
        ))}
      </div>
      <Modal open={pick} title="Add a contact" kicker={project.name} onClose={() => setPick(false)}>
        <div className="stack">
          <div className="spread">
            <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the book" />
            <Link className="btn" href={`/contacts/new?attach=${project.id}`}>New contact</Link>
          </div>
          <div className="card-scroll stack" style={{ maxHeight: 320, flex: "none" }}>
          {available.length === 0 && <p className="muted">{(store.contacts || []).length === 0 ? "The book is empty. Create the first contact and they land on this project." : "No one left to add."}</p>}
          {available.map((contact) => (
            <button
              key={contact.id}
              type="button"
              className="spread card pick-row"
              onClick={() => { store.attachContact(project.id, contact.id); setPick(false); }}
            >
              <span>
                <strong>{contact.name}</strong>
                <div className="muted">{contact.title || "Title not set"}{contact.phone ? ` · ${contact.phone}` : ""}</div>
              </span>
              <span className="tiny">Add</span>
            </button>
          ))}
          </div>
        </div>
      </Modal>
      <Confirm
        open={drop != null}
        title={drop ? `Take ${drop.name} off this project?` : "Remove contact?"}
        text="They stay in Contacts. Only this project loses them."
        onConfirm={() => { if (drop) store.detachContact(project.id, drop.id); setDrop(null); }}
        onClose={() => setDrop(null)}
      />
    </div>
  );
}

function Wallets({ projectId, onAdd, onEdit }: { projectId: string; onAdd: () => void; onEdit: (wallet: Wallet) => void }) {
  const { store, project } = useProject(projectId);
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [dropWallet, setDropWallet] = useState<Wallet | null>(null);
  return (
    <div className="stack">
      <div className="check-controls">
        <div className="spread">
          <div>
            <strong>Hot wallets</strong>
            <p className="tiny">Keys stay in this browser. Show a key only when you need it.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={onAdd}>Add wallet</button>
        </div>
      </div>
      {project.wallets.length === 0 ? <Empty title="No hot wallets" text="Add the execution wallet for this token. The key stays in this browser." /> : (
        <div className="table-wrap">
          <table className="blotter">
            <thead>
              <tr><th>Wallet</th><th>Chain</th><th>Purpose</th><th>Address</th><th>Key</th><th></th></tr>
            </thead>
            <tbody>
              {project.wallets.map((wallet) => {
                const open = shown[wallet.id];
                const key = wallet.privateKey || "";
                return (
                  <tr key={wallet.id}>
                    <td><button type="button" className="row-hit" onClick={() => onEdit(wallet)}><strong>{wallet.label}</strong></button></td>
                    <td><span className="brand-bit">{chainLogo(wallet.chain) && <img className="mark-logo" src={chainLogo(wallet.chain)} alt="" />}{wallet.chain || "—"}</span></td>
                    <td>{wallet.purpose || "—"}</td>
                    <td className="clip" title={wallet.address || undefined}><code>{wallet.address || "—"}</code></td>
                    <td className="clip">
                      <span className="key-line">
                        <code>{open ? (key || "—") : "••••••••••••"}</code>
                        <button type="button" className="btn btn-ghost btn-small" onClick={() => setShown((current) => ({ ...current, [wallet.id]: !current[wallet.id] }))}>{open ? "Hide" : "Show"}</button>
                      </span>
                    </td>
                    <td>
                      <Menu items={[
                        { label: "Edit", onClick: () => onEdit(wallet) },
                        { label: open ? "Hide key" : "Show key", onClick: () => setShown((current) => ({ ...current, [wallet.id]: !current[wallet.id] })) },
                        { label: "Remove", danger: true, onClick: () => setDropWallet(wallet) },
                      ]} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Confirm
        open={dropWallet != null}
        title={dropWallet ? `Remove ${dropWallet.label}?` : "Remove wallet?"}
        text="The address and private key leave this project. Nothing is sent on-chain."
        onConfirm={() => { if (dropWallet) store.removeWallet(project.id, dropWallet.id); setDropWallet(null); }}
        onClose={() => setDropWallet(null)}
      />
    </div>
  );
}

function Socials({ projectId, onAdd, onEdit }: { projectId: string; onAdd: () => void; onEdit: (social: SocialAccount) => void }) {
  const { store, project } = useProject(projectId);
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [drop, setDrop] = useState<SocialAccount | null>(null);
  const rows = project.socials || [];
  const toggle = (id: string) => setShown((current) => ({ ...current, [id]: !current[id] }));
  return (
    <div className="stack">
      <div className="check-controls">
        <div className="spread">
          <div>
            <strong>Accounts</strong>
            <p className="tiny">Links and passwords stay in this browser. Show a password only when you need it.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={onAdd}>Add social</button>
        </div>
      </div>
      {rows.length === 0 ? <Empty title="No socials" text="Add X, Telegram, Discord, a site, or any other account." action={<button type="button" className="btn btn-primary" onClick={onAdd}>Add social</button>} /> : (
        <div className="social-grid">
          {rows.map((social) => {
            const open = shown[social.id];
            const link = href(social.url);
            const logo = socialLogo(social.name);
            return (
              <article key={social.id} className="social-card">
                <div className="spread">
                  <span className="token-logo">{logo ? <img src={logo} alt="" /> : initials(social.name)}</span>
                  <Menu items={[
                    { label: "Edit", onClick: () => onEdit(social) },
                    { label: open ? "Hide password" : "Show password", onClick: () => toggle(social.id) },
                    ...(link ? [{ label: "Open", onClick: () => window.open(link, "_blank", "noopener") }] : []),
                    { label: "Remove", danger: true, onClick: () => setDrop(social) },
                  ]} />
                </div>
                <div className="card-id">
                  <strong>{social.name}</strong>
                  {social.handle ? <div className="tiny">{social.handle}</div> : null}
                </div>
                <div className="lane-grid">
                  <div>
                    <span>Link</span>
                    {link ? <a className="num" href={link} target="_blank" rel="noreferrer" title={social.url}>{link.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a> : <span className="num">—</span>}
                  </div>
                  <div>
                    <span>Password</span>
                    <span className="num key-line">
                      <code>{open ? (social.password || "—") : "••••••••"}</code>
                      <button type="button" className="btn btn-ghost btn-small" onClick={() => toggle(social.id)}>{open ? "Hide" : "Show"}</button>
                    </span>
                  </div>
                  <div><span>Note</span><span className="num" title={social.note || undefined}>{social.note || "—"}</span></div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Confirm
        open={drop != null}
        title={drop ? `Remove ${drop.name}?` : "Remove social?"}
        text="The link and password leave this project."
        onConfirm={() => { if (drop) store.removeSocial(project.id, drop.id); setDrop(null); }}
        onClose={() => setDrop(null)}
      />
    </div>
  );
}

function Checks({ projectId }: { projectId: string }) {
  const { store, project } = useProject(projectId);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<PhaseId>("phase-1");
  const [drop, setDrop] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>("startup");
  const sections = WORK_LANES.map((lane) => ({ id: lane.id, label: lane.label }));
  const dropping = project.checks.find((check) => check.id === drop);
  return (
    <div className="stack">
      <form className="check-add" onSubmit={(event) => {
        event.preventDefault();
        if (!text.trim()) return;
        const lane = WORK_LANES.find((item) => item.id === phase);
        store.addCheck(project.id, { id: uid("chk"), group: lane?.label || "Startup", phase, text: text.trim(), done: false, critical: false });
        setText("");
      }}>
        <Select label="Phase" value={phase} onChange={(value) => setPhase(value as PhaseId)} options={WORK_LANES.map((lane) => ({ value: lane.id, label: lane.label }))} />
        <input className="input" placeholder="Add a checkpoint to this phase" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn" type="submit">Add</button>
      </form>
      <div className="stack">
        {sections.map((section) => {
          const all = checksInPhase(project, section.id);
          const done = all.filter((check) => check.done).length;
          const expanded = open === section.id;
          return (
            <section key={section.id} className="card check-phase">
              <button type="button" className="check-phase-head" onClick={() => setOpen(expanded ? null : section.id)}>
                <strong>{section.label}</strong>
                <span className="tiny">{done}/{all.length}</span>
                <span className="tiny">{expanded ? "Hide" : "Open"}</span>
              </button>
              {expanded && (
                <div className="check-phase-scroll">
                  <table className="blotter catalog">
                    <thead>
                      <tr><th /><th>Checkpoint</th><th>Group</th><th>Flag</th><th /></tr>
                    </thead>
                    <tbody>
                      {all.length === 0 ? (
                        <tr><td colSpan={5} className="muted">No checks in {section.label} yet.</td></tr>
                      ) : all.map((check) => (
                        <tr key={check.id} className={check.done ? "on" : undefined}>
                          <td className="tick">
                            <button type="button" className="box" aria-label={check.done ? "Mark open" : "Mark done"} onClick={() => store.toggleCheck(project.id, check.id)}>{check.done ? "✓" : ""}</button>
                          </td>
                          <td><strong className="check-text">{check.text}</strong></td>
                          <td>{check.group}</td>
                          <td>{check.critical ? <Pill tone="clay">Critical</Pill> : "—"}</td>
                          <td className="act"><button type="button" className="btn btn-small" onClick={() => setDrop(check.id)}>Remove</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>
      <Confirm
        open={drop != null}
        title={dropping ? `Remove “${dropping.text}”?` : "Remove check?"}
        text="This takes the checkpoint off the phase. Marking the box only records it as done."
        onConfirm={() => { if (drop) store.removeCheck(project.id, drop); setDrop(null); }}
        onClose={() => setDrop(null)}
      />
    </div>
  );
}

function Flow({ projectId }: { projectId: string }) {
  const { store, project } = useProject(projectId);
  const quote = projectQuote(project, store.settings);
  const max = Math.max(quote.netUsd, project.budgetUsd, 1);

  return (
    <div className="stack">
      <div className="split">
        <div className="card">
          <div className="donut-wrap">
            <Donut parts={quote.byPhase.map((part) => ({ value: part.usd, color: PHASE_COLOR[part.phase] }))} />
            <div>
              {quote.byPhase.map((part) => (
                <div key={part.phase} className="spread"><span><i className="swatch" style={{ background: PHASE_COLOR[part.phase] }} /> {phaseOf(part.phase).label}</span><span>{formatUsd(part.usd)}</span></div>
              ))}
              {quote.byPhase.length === 0 && <p className="muted">Add priced rows to see the mix.</p>}
            </div>
          </div>
          <div style={{ marginTop: 16 }}><PhaseBars parts={quote.byPhase} /></div>
        </div>
        <div className="card fall">
          <div><span>Subtotal</span><b>{formatUsd(quote.subtotalUsd)}</b></div>
          <div><span>Discount</span><b className="clay">−{formatUsd(quote.discountUsd)}</b></div>
          <div className="fall-total"><span>Spend</span><b>{formatUsd(quote.netUsd)}</b></div>
          <div><span>Paid</span><b className="sage">{formatUsd(quote.paidUsd)}</b></div>
          <div><span>Committed</span><b>{formatUsd(quote.invoicedUsd)}</b></div>
          <div><span>Remaining</span><b>{formatUsd(quote.balanceUsd)}</b></div>
          {quote.weeklyUsd > 0 && <div><span>Weekly retainer</span><b>{formatUsd(quote.weeklyUsd)}</b></div>}
          {quote.marginUsd != null && <div><span>Margin on costed rows</span><b>{formatUsd(quote.marginUsd)}</b></div>}
          <p className="tiny">The discount sits on the plan, not on each row. Remaining is spend minus paid and comped rows.</p>
          {project.budgetUsd > 0 && (
            <div>
              <div className="tiny">Spend vs budget {formatUsd(project.budgetUsd)}</div>
              <div className="track"><span style={{ width: `${Math.min(100, (quote.netUsd / max) * 100)}%`, background: quote.netUsd > project.budgetUsd ? "#ff6b57" : "#3dbe86" }} /></div>
            </div>
          )}
        </div>
      </div>
      <p className="muted">Pre-launch, phase 1, phase 2, phase 3, and startup are edited on the Project tab. They are not one pot.</p>
    </div>
  );
}

function FieldLike({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="field">
      <span className="label">{label}</span>
      <input className="input" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />
    </label>
  );
}

function Statement({ projectId }: { projectId: string }) {
  const { store, project } = useProject(projectId);
  const quote = projectQuote(project, store.settings);
  const pad = byId(store.platforms, project.launchpadId);
  return (
    <article className="sheet">
      <div className="check-toolbar">
        <div>
          <div className="tiny">{store.settings.deskName}</div>
          <strong>{project.name}</strong>
          <div className="muted">{tickerOf(project.ticker)} · {project.chain} · {pad?.name || "Launchpad unset"} · {formatDay(project.targetDate)}</div>
        </div>
        <button type="button" className="btn no-print" onClick={() => window.print()}>Print</button>
      </div>
      <div className="check-sheet">
        <div className="check-head">
          <span>Line</span>
          <span>Phase</span>
          <span>Detail</span>
          <span>Amount</span>
        </div>
        {quote.rows.map(({ line, gross }) => (
          <div key={line.id} className="check-row">
            <span>{line.name}</span>
            <span className="tiny">{phaseOf(line.phase).label}</span>
            <span className="tiny">{line.detail || "—"}</span>
            <span className="num">{money(gross, line.currency)}</span>
          </div>
        ))}
      </div>
      <div className="sheet-totals">
        <div><span>Subtotal</span><b>{formatUsd(quote.subtotalUsd)}</b></div>
        <div><span>Discount{project.discountNote ? ` · ${project.discountNote}` : ""}</span><b className="clay">−{formatUsd(quote.discountUsd)}</b></div>
        <div className="fall-total"><span>Spend</span><b>{formatUsd(quote.netUsd)}</b></div>
        <p className="tiny">ETH {formatUsd(store.settings.ethUsd)} · EUR {store.settings.eurUsd} USD. Rates are entered here.</p>
      </div>
    </article>
  );
}
