"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { BriefEditor, DiscountEditor, LineEditor, SocialEditor, WalletEditor } from "../components/editors";
import { SupplyPicker } from "../components/SupplyPicker";
import { MarketBoard } from "../components/MarketBoard";
import { Confirm, CopyIcon, Empty, Menu, Modal, Select, Tabs } from "../components/ui";
import { cloneProject } from "../lib/clone";
import { byId, formatCompactUsd, formatDay, formatEth, formatUsd, href, money, shortAddress, tickerOf, whatsappHref } from "../lib/format";
import { uid } from "../lib/id";
import { BILLING, LAUNCH_KINDS, LINE_STATUSES, PHASES, PHASE_COLOR, PROJECT_STATUSES, ROUTE_LABEL, WORK_LANES, launchKindOf, phaseOf } from "../lib/labels";
import { checksInPhase } from "../lib/checks";
import { earnedIn, earningEntries } from "../lib/earnings";
import { chainLogo } from "../lib/brands";
import { SocialMark, hasSocialMark } from "../components/SocialMark";
import { initials, readAsset, readLogo } from "../lib/logo";
import { deskMark, packageMark, serviceMark } from "../lib/marks";
import { projectQuote } from "../lib/quote";
import { SUPPLY_ROWS } from "../lib/treasury";
import { mockMarket } from "../lib/mockMarket";
import { formatShare, formatTokens, walletHolding } from "../lib/walletHoldings";
import { useStore } from "../store";
import { useUi } from "../ui";
import { Article, CheckSquare, ClipboardText, Copy, CurrencyCircleDollar, DownloadSimple, FileText, LinkSimple, Plus, Rocket, ShareNetwork, Trash, Users, Wallet as WalletIcon } from "@phosphor-icons/react";
import type { AssetPack, BillingStatus, Contact, LaunchKind, LineItem, LineStatus, PhaseId, SocialAccount, SupplyPct, SupplyRoute, TreasuryKey, Wallet } from "../types";

function editToken(id: string, focus: string) {
  return `/projects/${id}?tab=brief&edit=1&focus=${focus}`;
}

function CopyValue({ text, copy, mono }: { text: string; copy?: string; mono?: boolean }) {
  return (
    <span className="copy-line">
      <strong className={mono ? "mono" : undefined}>{text}</strong>
      <CopyIcon text={copy ?? text} />
    </span>
  );
}

function Fact({ label, text, copy, mono, onSet, className }: { label: string; text: string; copy?: string; mono?: boolean; onSet?: () => void; className?: string }) {
  const missing = !text.trim() || text === "—" || text === "Not set";
  const body = (
    <>
      <span className="tiny">{label}</span>
      {missing ? <strong>Not set</strong> : <CopyValue text={text} copy={copy} mono={mono} />}
    </>
  );
  if (missing && onSet) return <button type="button" className={className ? `set-cell ${className}` : "set-cell"} onClick={onSet}>{body}</button>;
  return <div className={className}>{body}</div>;
}

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
  const [walletGroup, setWalletGroup] = useState<"hot" | "supply">("hot");
  const [socialEdit, setSocialEdit] = useState<SocialAccount | null | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!project) {
    return <div className="page"><Empty title="Project missing" text="It may have been deleted." action={<Link className="btn" href="/projects">Back to projects</Link>} /></div>;
  }

  const pad = byId(store.platforms, project.launchpadId);
  const done = project.checks.filter((check) => check.done).length;

  return (
    <div className="page screen">
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
            {project.ticker.trim() ? (
              <span className="copy-line"><span>{tickerOf(project.ticker)}</span><CopyIcon text={tickerOf(project.ticker)} /></span>
            ) : (
              <button type="button" className="text-set" onClick={() => router.push(editToken(project.id, "ticker"))}>Not set</button>
            )}
            <span className="copy-line brand-bit"><span className="brand-bit">{chainLogo(project.chain) && <img className="mark-logo" src={chainLogo(project.chain)} alt="" />}{project.chain}</span><CopyIcon text={project.chain} /></span>
            {pad ? (
              <span className="copy-line brand-bit"><span className="brand-bit">{pad.logo && <img className="mark-logo" src={pad.logo} alt="" />}{pad.name}</span><CopyIcon text={pad.name} /></span>
            ) : (
              <span className="brand-bit">On-chain</span>
            )}
          </div>
          <h1 className="display copy-line"><span>{project.name}</span><CopyIcon text={project.name} /></h1>
          <div className="desk-token">
            {project.contract.trim() ? (
              <div><span className="tiny">Contract</span><span className="copy-line"><span className="mono" title={project.contract}>{shortAddress(project.contract)}</span><CopyIcon text={project.contract} /></span></div>
            ) : (
              <button type="button" className="set-cell" onClick={() => router.push(editToken(project.id, "contract"))}><span className="tiny">Contract</span><strong>Not set</strong></button>
            )}
            {project.supply.trim() ? (
              <div><span className="tiny">Supply</span><span className="copy-line"><span title={project.supply}>{project.supply}</span><CopyIcon text={project.supply} /></span></div>
            ) : (
              <button type="button" className="set-cell" onClick={() => router.push(editToken(project.id, "supply"))}><span className="tiny">Supply</span><strong>Not set</strong></button>
            )}
            {project.client.trim() ? (
              <div><span className="tiny">Owner</span><span className="copy-line"><span>{project.client}</span><CopyIcon text={project.client} /></span></div>
            ) : (
              <button type="button" className="set-cell" onClick={() => router.push(editToken(project.id, "owner"))}><span className="tiny">Owner</span><strong>Not set</strong></button>
            )}
            {project.targetDate ? (
              <div><span className="tiny">Target</span><span className="copy-line"><span>{formatDay(project.targetDate)}</span><CopyIcon text={formatDay(project.targetDate)} /></span></div>
            ) : (
              <button type="button" className="set-cell" onClick={() => router.push(editToken(project.id, "target"))}><span className="tiny">Target</span><strong>Not set</strong></button>
            )}
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
          <button type="button" className="btn" onClick={() => router.push(`/projects/${project.id}?tab=brief&edit=1`)}>Edit token</button>
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
          { id: "desk", label: "Project", icon: Rocket },
          { id: "brief", label: "Details", icon: Article },
          { id: "wallets", label: "Wallets", icon: WalletIcon, count: project.wallets.length },
          { id: "socials", label: "Socials", icon: ShareNetwork, count: project.socials?.length || 0 },
          { id: "contacts", label: "Contacts", icon: Users, count: project.contactIds?.length || 0 },
          { id: "quote", label: "Plan", icon: ClipboardText, count: project.lineItems.length },
          { id: "checks", label: "Checklist", icon: CheckSquare, count: project.checks.length - done },
          { id: "flow", label: "Money", icon: CurrencyCircleDollar },
          { id: "statement", label: "Summary", icon: FileText },
        ]}
      />
      <div className="desk-fit">
      {tab === "desk" && <Desk projectId={project.id} onWallet={() => setWalletEdit(null)} onEditLine={(row) => setLine(row)} />}
      {tab === "brief" && <Brief projectId={project.id} />}
      {tab === "wallets" && <Wallets projectId={project.id} onAdd={(group) => { setWalletGroup(group); setWalletEdit(null); }} onEdit={(row) => setWalletEdit(row)} />}
      {tab === "socials" && <Socials projectId={project.id} onAdd={() => setSocialEdit(null)} onEdit={(row) => setSocialEdit(row)} />}
      {tab === "contacts" && <People projectId={project.id} />}
      {tab === "quote" && <Quote projectId={project.id} onDiscount={() => setDiscountOpen(true)} onEdit={(row) => setLine(row)} onCustom={() => setLine(null)} />}
      {tab === "checks" && <Checks projectId={project.id} />}
      {tab === "flow" && <Flow projectId={project.id} />}
      {tab === "statement" && <Statement projectId={project.id} />}
      </div>
      <DiscountEditor open={discountOpen} project={project} onClose={() => setDiscountOpen(false)} />
      <LineEditor open={line !== undefined} project={project} line={line ?? null} onClose={() => setLine(undefined)} />
      <WalletEditor open={walletEdit !== undefined} project={project} wallet={walletEdit ?? null} group={walletEdit?.group === "supply" ? "supply" : walletGroup} onClose={() => setWalletEdit(undefined)} />
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

const DESK_LANES = [...WORK_LANES, PHASES.find((phase) => phase.id === "bundle")!];

function Desk({ projectId, onWallet, onEditLine }: { projectId: string; onWallet: () => void; onEditLine: (line: LineItem) => void }) {
  const { store, project } = useProject(projectId);
  const ui = useUi();
  const router = useRouter();
  const params = useSearchParams();
  const quote = projectQuote(project, store.settings);
  const active = DESK_LANES.find((lane) => lane.id === params.get("phase")) ?? null;
  const openPhase = (id: PhaseId) => router.push(`/projects/${project.id}?tab=desk&phase=${id}`);
  const closePhase = () => router.push(`/projects/${project.id}?tab=desk`);

  if (active) {
    const checks = checksInPhase(project, active.id);
    const done = checks.filter((check) => check.done).length;
    return (
      <div className="phase-page">
        <div className="phase-bar">
          <button type="button" className="btn" onClick={closePhase}>Back</button>
          <div className="phase-title">
            <h2>{active.n} · {active.label}</h2>
            <p className="tiny">{active.hint}</p>
          </div>
          <div className="figure">{done}/{checks.length}</div>
          <button type="button" className="btn btn-primary" onClick={() => ui.openAdd({ projectId: project.id, phase: active.id })}>Add</button>
        </div>
        <LaneBody lane={active} projectId={project.id} onWallet={onWallet} onEditLine={onEditLine} />
      </div>
    );
  }

  return (
    <div className="lane-board">
      {DESK_LANES.map((lane) => {
        const rows = quote.rows.filter((row) => row.line.phase === lane.id);
        const checks = checksInPhase(project, lane.id);
        const done = checks.filter((check) => check.done).length;
        const usd = rows.reduce((sum, row) => sum + row.usd, 0);
        return (
          <button key={lane.id} type="button" className="lane-tile" onClick={() => openPhase(lane.id)}>
            <div className="spread">
              <span className="lane-name">{lane.n} · {lane.label}</span>
              <span className="tiny">Checklist</span>
            </div>
            <div className="figure">{done}/{checks.length}</div>
            <p className="muted">{lane.hint}</p>
            <div className="lane-preview">
              {checks.map((check) => (
                <div key={check.id}><span>{check.text}</span><b className={check.done ? "num done" : "num"}>{check.done ? "Done" : "Open"}</b></div>
              ))}
              {checks.length === 0 && rows.map(({ line, gross }) => (
                <div key={line.id} className="plan-line">
                  <span>{line.name}</span>
                  <span className="tiny">{line.detail || "—"}</span>
                  <b className="num">{money(gross, line.currency)}</b>
                </div>
              ))}
            </div>
            <div className="lane-foot"><span className="tiny">Plan</span><strong>{formatUsd(usd)}</strong></div>
          </button>
        );
      })}
    </div>
  );
}

function LaneBody({ lane, projectId, onWallet, onEditLine }: { lane: (typeof DESK_LANES)[number]; projectId: string; onWallet: () => void; onEditLine: (line: LineItem) => void }) {
  const { store, project } = useProject(projectId);
  const quote = projectQuote(project, store.settings);
  const params = useSearchParams();
  const t = project.treasury;
  const set = (patch: Partial<typeof t>) => store.updateProject(project.id, { treasury: { ...t, ...patch } });
  const asked = params.get("step");
  const [step, setStep] = useState<null | "fee" | "supply" | "volume" | "mm" | "wallets">(
    asked === "fee" || asked === "supply" || asked === "volume" || asked === "mm" || asked === "wallets" ? asked : null,
  );
  const posted = (key: TreasuryKey) => project.lineItems.some((line) => line.meta?.treasuryKey === key);
  const supplyRow = SUPPLY_ROWS.find((row) => row.pct === t.supplyPct);
  const supplyEth = supplyRow && t.route ? supplyRow[t.route] : null;
  const rows = quote.rows.filter((row) => row.line.phase === lane.id);
  const checks = checksInPhase(project, lane.id);
  const usd = rows.reduce((sum, row) => sum + row.usd, 0);
  const hasTools = lane.id === "startup" || lane.id === "prelaunch" || lane.id === "phase-1";
  const tools = (
    <>
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
            {lane.id === "startup" && step === "supply" && (
              <div className="tool-view">
                <div className="spread">
                  <button type="button" className="btn" onClick={() => setStep(null)}>Steps</button>
                  <button type="button" className="btn btn-primary" onClick={() => store.postTreasury(project.id, "supply")}>{posted("supply") ? "Update supply" : "Post supply"}</button>
                </div>
                <SupplyPicker pct={t.supplyPct} route={t.route} ethUsd={store.settings.ethUsd} onChange={(pct: SupplyPct, route: SupplyRoute) => set({ supplyPct: pct, route })} />
              </div>
            )}
            {lane.id === "startup" && step !== "supply" && (
              <div className="step-grid">
                <button type="button" className="step-card" onClick={() => setStep("fee")}>
                  <div className="spread"><span className="tiny">Launch fee</span><span className="tiny">{posted("pons") ? "Posted" : "Open"}</span></div>
                  <b className="figure">{formatEth(t.launchFeeEth)}</b>
                  <span className="tiny">{t.launchFeeLabel || "Launch fee"}</span>
                </button>
                <button type="button" className="step-card" onClick={() => setStep("wallets")}>
                  <div className="spread"><span className="tiny">Hot wallets</span><span className="tiny">{project.wallets.length > 0 ? "Posted" : "Open"}</span></div>
                  <b className="figure">{project.wallets.length}</b>
                  <span className="tiny">{t.hotWalletsNote || "Hot wallets"}</span>
                </button>
                <button type="button" className="step-card wide" onClick={() => setStep("supply")}>
                  <div className="spread"><span className="tiny">Supply</span><span className="tiny">{posted("supply") ? "Posted" : "Open"}</span></div>
                  <b className="figure">{t.supplyPct ? `Buy ${t.supplyPct}%` : "Not set"}</b>
                  <span className="tiny">{supplyEth != null && t.route ? `${ROUTE_LABEL[t.route]} · ${formatEth(supplyEth)}` : "V1 or V2"}</span>
                </button>
                <button type="button" className="step-card" onClick={() => setStep("volume")}>
                  <div className="spread"><span className="tiny">Volume</span><span className="tiny">{posted("volume") ? "Posted" : "Open"}</span></div>
                  <b className="figure">{formatUsd(t.volumeBudgetUsd)}</b>
                  <span className="tiny">{t.volumeTarget || "Volume"}</span>
                </button>
                <button type="button" className="step-card" onClick={() => setStep("mm")}>
                  <div className="spread"><span className="tiny">Market making</span><span className="tiny">{posted("mm-budget") || posted("mm-weeks") ? "Posted" : "Open"}</span></div>
                  <b className="figure">{t.mmWeeks}</b>
                  <span className="tiny">{formatUsd(t.mmWeeklyUsd)} / week</span>
                </button>
              </div>
            )}
            <Modal open={step === "fee"} title="Launch fee" onClose={() => setStep(null)}>
              <div className="form-grid">
                <FieldLike label="Launch fee ETH" value={t.launchFeeEth} onChange={(value) => set({ launchFeeEth: value })} />
                <label className="field"><span className="label">Fee label</span><input className="input" value={t.launchFeeLabel} onChange={(e) => set({ launchFeeLabel: e.target.value })} /></label>
              </div>
              <button type="button" className="btn btn-primary" onClick={() => store.postTreasury(project.id, "pons")}>{posted("pons") ? "Update launch fee" : "Post launch fee"}</button>
            </Modal>
            <Modal open={step === "volume"} title="Volume" onClose={() => setStep(null)}>
              <div className="form-grid">
                <FieldLike label="Volume budget USD" value={t.volumeBudgetUsd} onChange={(value) => set({ volumeBudgetUsd: value })} />
                <label className="field"><span className="label">Volume target</span><input className="input" value={t.volumeTarget} onChange={(e) => set({ volumeTarget: e.target.value })} /></label>
              </div>
              <button type="button" className="btn btn-primary" onClick={() => store.postTreasury(project.id, "volume")}>{posted("volume") ? "Update volume" : "Post volume"}</button>
            </Modal>
            <Modal open={step === "mm"} title="Market making" onClose={() => setStep(null)}>
              <div className="form-grid">
                <FieldLike label="MM budget USD" value={t.mmBudgetUsd} onChange={(value) => set({ mmBudgetUsd: value })} />
                <FieldLike label="MM USD / week" value={t.mmWeeklyUsd} onChange={(value) => set({ mmWeeklyUsd: value })} />
                <FieldLike label="MM weeks" value={t.mmWeeks} onChange={(value) => set({ mmWeeks: value })} />
              </div>
              <div className="cluster">
                <button type="button" className="btn" onClick={() => store.postTreasury(project.id, "mm-budget")}>{posted("mm-budget") ? "Update budget" : "Post budget"}</button>
                <button type="button" className="btn" onClick={() => store.postTreasury(project.id, "mm-weeks")}>{posted("mm-weeks") ? "Update weeks" : "Post weeks"}</button>
              </div>
            </Modal>
            <Modal open={step === "wallets"} title="Hot wallets" onClose={() => setStep(null)}>
              <label className="field"><span className="label">Hot wallets</span><input className="input" value={t.hotWalletsNote} onChange={(e) => set({ hotWalletsNote: e.target.value })} /></label>
              <div className="stack">
                {project.wallets.map((wallet) => (
                  <div key={wallet.id} className="spread"><span>{wallet.label}<span className="tiny"> {wallet.purpose}</span></span><span className="mono">{wallet.address || "TBD"}</span></div>
                ))}
                <button type="button" className="btn" onClick={onWallet}>Add hot wallet</button>
              </div>
            </Modal>
    </>
  );

  const showLines = rows.length > 0;
  const tuckTools = hasTools && showLines;
  const toolPane = hasTools && !tuckTools;
  const panes = Number(showLines) + 1 + Number(toolPane);
  const plan = <div className="lane-foot"><span className="tiny">Plan</span><strong>{formatUsd(usd)}</strong></div>;

  return (
    <div className={panes > 1 ? "phase-fit" : "phase-fit solo"}>
      {showLines && (
        <section className="card phase-sheet">
          <div className="line-fill">
            {rows.map(({ line, gross }) => (
              <button key={line.id} type="button" className="list-row plan-line" onClick={() => onEditLine(line)}>
                <span>{line.name}</span>
                <span className="tiny">{line.detail || "—"}</span>
                <b className="num">{money(gross, line.currency)}</b>
              </button>
            ))}
          </div>
          {plan}
        </section>
      )}
      {toolPane && (
        <section className="card phase-sheet">
          <div className="phase-tools">{tools}</div>
          {plan}
        </section>
      )}
      <section className="card phase-sheet">
        <div className="tiny">Checklist</div>
        <div className="line-fill">
          {checks.length === 0 && <p className="muted line-empty">No checks in this phase.</p>}
          {checks.map((check) => (
            <div key={check.id} className="list-row"><span>{check.text}</span><b className="num">{check.done ? "Done" : "Open"}</b></div>
          ))}
        </div>
        {tuckTools && <div className="phase-tools">{tools}</div>}
        {!showLines && !toolPane && plan}
      </section>
    </div>
  );
}

function planContacts(store: { services: { id: string; providerId: string; contactId?: string }[]; contacts: Contact[] }, project: { lineItems: LineItem[] }) {
  const found = new Map<string, Contact>();
  for (const line of project.lineItems) {
    if (line.source !== "service") continue;
    const service = line.refId ? store.services.find((item) => item.id === line.refId) : undefined;
    const contactId = service?.contactId || store.services.find((item) => item.providerId === line.providerId && item.contactId)?.contactId;
    if (!contactId || found.has(contactId)) continue;
    const contact = store.contacts.find((item) => item.id === contactId);
    if (contact) found.set(contactId, contact);
  }
  return [...found.values()];
}

function Brief({ projectId }: { projectId: string }) {
  const { store, project } = useProject(projectId);
  const router = useRouter();
  const search = useSearchParams();
  const editing = search.get("edit") === "1";
  const pad = byId(store.platforms, project.launchpadId);
  const contacts = planContacts(store, project);
  const closeEdit = () => router.push(`/projects/${project.id}?tab=brief`);
  const open = (focus: string) => router.push(editToken(project.id, focus));
  return (
    <div className="fit-stack">
      <div className="brief-layout">
        <div className="brief-main">
          {editing ? <BriefEditor embedded project={project} focus={search.get("focus")} onClose={closeEdit} /> : (
            <section className="card identity-card">
              <h2>Identity</h2>
              <div className="identity-fit">
                <div className="identity-grid">
                  <Fact label="Owner" text={project.client} onSet={() => open("owner")} />
                  <div>
                    <span className="tiny">Chain</span>
                    <span className="copy-line">
                      <strong className="brand-bit">{chainLogo(project.chain) && <img className="mark-logo" src={chainLogo(project.chain)} alt="" />}{project.chain || "—"}</strong>
                      <CopyIcon text={project.chain} />
                    </span>
                  </div>
                  <div>
                    <span className="tiny">Launchpad</span>
                    {pad ? (
                      <span className="copy-line">
                        <Link href={`/platforms/${pad.id}`} className="brand-bit">{pad.logo && <img className="mark-logo" src={pad.logo} alt="" />}{pad.name}</Link>
                        <CopyIcon text={pad.name} />
                      </span>
                    ) : <strong>—</strong>}
                  </div>
                  <Fact label="Target" text={project.targetDate ? formatDay(project.targetDate) : ""} onSet={() => open("target")} />
                  <Fact label="Budget" text={project.budgetUsd ? formatUsd(project.budgetUsd) : ""} copy={project.budgetUsd ? String(project.budgetUsd) : ""} onSet={() => open("budget")} />
                  <Fact label="Supply" text={project.supply} onSet={() => open("supply")} />
                  <Fact className="span-2" label="Contract" text={project.contract} mono onSet={() => open("contract")} />
                </div>
                <MarketBoard id={project.id} />
                {project.notes && <p className="muted identity-note">{project.notes}</p>}
              </div>
            </section>
          )}
        </div>
        <div className="brief-side">
          <section className="card hold">
            <div className="tiny">Contacts</div>
            <div className="line-fill">
              {contacts.length === 0 && <p className="muted line-empty">No contact on these services.</p>}
              {contacts.map((contact) => (
                <Link key={contact.id} href={`/contacts/${contact.id}`} className="list-row seller-row">
                  <span className="token-logo sm">{contact.image ? <img src={contact.image} alt="" /> : initials(contact.name)}</span>
                  <span>{contact.name}</span>
                  <span className="tiny">{contact.company || contact.title || "—"}</span>
                </Link>
              ))}
            </div>
          </section>
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
        <button type="button" className="btn btn-small" onClick={() => setOpen(true)}><Plus size={14} />Add</button>
      </div>
      <div className="line-fill">
        {packs.length === 0 && <p className="muted line-empty">No {kind === "logo" ? "logo" : "banner"} pack yet.</p>}
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
      <Modal open={open} title={kind === "logo" ? "Logo pack" : "Banner pack"} onClose={() => { setOpen(false); setFiles([]); }}>
        <div className="stack">
          <label className="field"><span className="label">Name</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === "logo" ? "Square set" : "Launch banners"} /></label>
          <label className="field"><span className="label">Share link</span><input className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" /></label>
          <label className="field"><span className="label">Files</span><input className="input" type="file" accept="image/*" multiple onChange={(e) => { void onFiles(e.target.files); e.target.value = ""; }} /></label>
          {files.length > 0 && <div className="asset-files">{files.map((file) => <img key={file.id} src={file.data} alt="" />)}</div>}
          <div className="cluster">
            <button type="button" className="btn btn-primary" disabled={busy || (!name.trim() && !link.trim() && files.length === 0)} onClick={save}>{busy ? "Reading" : "Save pack"}</button>
            <button type="button" className="btn" onClick={() => { setOpen(false); setFiles([]); }}>Cancel</button>
          </div>
        </div>
      </Modal>
      <Confirm open={drop !== null} title="Remove this pack?" text="The files and the share link leave this token." confirm="Remove" onClose={() => setDrop(null)} onConfirm={() => { store.updateProject(project.id, { [key]: packs.filter((pack) => pack.id !== drop) }); setDrop(null); }} />
    </section>
  );
}

function Quote({ projectId, onDiscount, onEdit, onCustom }: { projectId: string; onDiscount: () => void; onEdit: (line: LineItem) => void; onCustom: () => void }) {
  const { store, project } = useProject(projectId);
  const ui = useUi();
  const quote = projectQuote(project, store.settings);
  const [dropLine, setDropLine] = useState<LineItem | null>(null);
  const [who, setWho] = useState<string | null>(null);
  const active = quote.rows.find((row) => row.line.id === who) || quote.rows[0];
  const markOf = (line: LineItem) => {
    if (line.source === "package" && line.refId) {
      const pack = byId(store.packages, line.refId);
      if (pack) return packageMark(pack, store.platforms);
    }
    if (line.source === "service" && line.refId) {
      const service = byId(store.services, line.refId);
      if (service) return serviceMark(service, store.platforms);
    }
    const provider = byId(store.providers, line.providerId);
    return provider ? deskMark(provider, store.platforms) : "";
  };
  return (
    <div className="fit-stack">
      <div className="check-split">
        <div className="plan-lists">
          <section className="card">
            <div className="spread">
              <h2>Items</h2>
              <div className="cluster">
                <button type="button" className="btn btn-small" onClick={onCustom}>Custom</button>
                <button type="button" className="btn btn-small" onClick={() => ui.openAdd({ projectId: project.id })}>Add</button>
              </div>
            </div>
            <div className="line-fill">
              {quote.rows.length === 0 ? <p className="muted line-empty">Nothing planned.</p> : quote.rows.map(({ line, gross }) => {
                const mark = markOf(line);
                return (
                  <button key={line.id} type="button" className={active?.line.id === line.id ? "list-row seller-row on" : "list-row seller-row"} onClick={() => setWho(line.id)}>
                    <span className="token-logo sm">{mark ? <img src={mark} alt="" /> : initials(line.name)}</span>
                    <span>{line.name}</span>
                    <b className="num">{money(gross, line.currency)}</b>
                  </button>
                );
              })}
            </div>
          </section>
          <section className="card">
            <h2>Totals</h2>
            <div className="plan-figures">
              {quote.mixed && quote.native.map((row) => (
                <div key={row.currency}><span className="tiny">{row.currency}</span><strong>{money(row.amount, row.currency)}</strong></div>
              ))}
              <div>
                <span className="tiny">Budget</span>
                <input className="input" value={project.budgetUsd} onChange={(e) => store.updateProject(project.id, { budgetUsd: Number(e.target.value) || 0 })} />
              </div>
              <div><span className="tiny">Subtotal</span><strong>{formatUsd(quote.subtotalUsd)}</strong></div>
              <button type="button" onClick={onDiscount}>
                <span className="tiny">Discount{project.discountNote ? ` · ${project.discountNote}` : ""}</span>
                <strong className="clay">−{formatUsd(quote.discountUsd)}</strong>
              </button>
              <div><span className="tiny">Paid</span><strong>{formatUsd(quote.paidUsd)}</strong></div>
              <div className="span-2"><span className="tiny">Remaining</span><strong>{formatUsd(quote.balanceUsd)}</strong></div>
            </div>
          </section>
        </div>
        <section className="card">
          {active ? (
            <>
              <div className="spread">
                <div className="contact-bit">
                  <span className="token-logo sm">{markOf(active.line) ? <img src={markOf(active.line)} alt="" /> : initials(active.line.name)}</span>
                  <span>
                    <h2>{active.line.name}</h2>
                    <span className="tiny">{active.line.detail || phaseOf(active.line.phase).label}</span>
                  </span>
                </div>
                <div className="cluster">
                  <button type="button" className="btn btn-small" onClick={() => store.moveLine(project.id, active.line.id, -1)}>Up</button>
                  <button type="button" className="btn btn-small" onClick={() => store.moveLine(project.id, active.line.id, 1)}>Down</button>
                  <button type="button" className="btn btn-small" onClick={() => onEdit(active.line)}>Edit</button>
                </div>
              </div>
              <div className="wallet-detail plan-detail">
                <div>
                  <span className="tiny">Phase</span>
                  <Select value={active.line.phase} onChange={(value) => store.updateLine(project.id, active.line.id, { phase: value as PhaseId })} options={PHASES.map((phase) => ({ value: phase.id, label: phase.label }))} />
                </div>
                <div>
                  <span className="tiny">Seller</span>
                  <strong className="brand-bit">{(() => { const seller = byId(store.providers, active.line.providerId); const mark = seller ? deskMark(seller, store.platforms) : ""; return <>{mark ? <img className="mark-logo" src={mark} alt="" /> : null}{seller?.name || "—"}</>; })()}</strong>
                </div>
                <div>
                  <span className="tiny">Status</span>
                  <Select value={active.line.status} onChange={(value) => store.updateLine(project.id, active.line.id, { status: value as LineStatus })} options={LINE_STATUSES.map((item) => ({ value: item.id, label: item.label }))} />
                </div>
                <div>
                  <span className="tiny">Payment</span>
                  <Select value={active.line.billing} onChange={(value) => store.updateLine(project.id, active.line.id, { billing: value as BillingStatus })} options={BILLING.map((item) => ({ value: item.id, label: item.label }))} />
                </div>
                <div>
                  <span className="tiny">Amount</span>
                  <b className="figure">{money(active.gross, active.line.currency)}</b>
                  {active.line.currency !== "USD" && <span className="tiny">{formatUsd(active.usd)}</span>}
                </div>
                <div>
                  <span className="tiny">Qty</span>
                  <strong>{active.line.qty}</strong>
                </div>
                <div className="span-2">
                  <span className="tiny">Note</span>
                  <textarea className="note-field" value={active.line.notes} placeholder="Write a note" onChange={(event) => store.updateLine(project.id, active.line.id, { notes: event.target.value })} />
                </div>
              </div>
              <button type="button" className="btn btn-danger" onClick={() => setDropLine(active.line)}>Remove</button>
            </>
          ) : <p className="muted line-empty">Add a row to see it here.</p>}
        </section>
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
  const [who, setWho] = useState<string | null>(null);
  const ids = project.contactIds || [];
  const people = ids.map((id) => (store.contacts || []).find((item) => item.id === id)).filter((item): item is Contact => Boolean(item));
  const q = query.trim().toLowerCase();
  const available = (store.contacts || []).filter((contact) => {
    if (ids.includes(contact.id)) return false;
    if (!q) return true;
    return `${contact.name} ${contact.title} ${contact.phone} ${contact.company}`.toLowerCase().includes(q);
  });

  const active = people.find((contact) => contact.id === who) || people[0];
  const face = (contact: Contact) => contact.image ? <img src={contact.image} alt="" /> : initials(contact.name);
  return (
    <div className="fit-stack">
      <div className="check-split">
        <section className="card">
          <div className="spread">
            <h2>People</h2>
            <button type="button" className="btn btn-small" onClick={() => { setQuery(""); setPick(true); }}>Add</button>
          </div>
          <div className="line-fill">
            {people.length === 0 ? <p className="muted line-empty">No one on this project.</p> : people.map((contact) => (
              <button key={contact.id} type="button" className={active?.id === contact.id ? "list-row seller-row on" : "list-row seller-row"} onClick={() => setWho(contact.id)}>
                <span className="token-logo sm">{face(contact)}</span>
                <span>{contact.name}</span>
                <span className="tiny">{contact.company || contact.title || "—"}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="card">
          {active ? (
            <>
              <div className="spread">
                <div className="contact-bit">
                  <span className="token-logo">{face(active)}</span>
                  <span>
                    <h2>{active.name}</h2>
                    <span className="tiny">{active.title || "Contact"}</span>
                  </span>
                </div>
                <Link className="btn btn-small" href={`/contacts/${active.id}`}>Open</Link>
              </div>
              <div className="wallet-detail people-detail">
                <div>
                  <span className="tiny">Title</span>
                  <strong>{active.title || "—"}</strong>
                </div>
                <div>
                  <span className="tiny">Company</span>
                  <strong>{active.company || "—"}</strong>
                </div>
                <div>
                  <span className="tiny">Email</span>
                  {active.email ? <span className="copy-line"><a href={href(active.email)}>{active.email}</a><CopyIcon text={active.email} /></span> : <Link className="text-set" href={`/contacts/${active.id}/edit`}>Not set</Link>}
                </div>
                <div>
                  <span className="tiny">Phone</span>
                  {whatsappHref(active.phone) ? <span className="copy-line"><a href={whatsappHref(active.phone)} target="_blank" rel="noreferrer">{active.phone}</a><CopyIcon text={active.phone} /></span> : <Link className="text-set" href={`/contacts/${active.id}/edit`}>Not set</Link>}
                </div>
                <div>
                  <span className="tiny">On the plan</span>
                  <strong>{coverage(store, project, active).on}</strong>
                </div>
                <div>
                  <span className="tiny">Still open</span>
                  <strong>{coverage(store, project, active).open}</strong>
                </div>
                <div className="span-2">
                  <span className="tiny">Note</span>
                  <textarea
                    className="note-field"
                    value={active.note}
                    placeholder="Write a note"
                    onChange={(event) => store.updateContact(active.id, { note: event.target.value })}
                  />
                </div>
              </div>
              <button type="button" className="btn btn-danger" onClick={() => setDrop(active)}>Remove</button>
            </>
          ) : <p className="muted line-empty">Add a contact to see them here.</p>}
        </section>
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
              <span className="contact-bit">
                <span className="token-logo sm">{contact.image ? <img src={contact.image} alt="" /> : initials(contact.name)}</span>
                <span>
                  <strong>{contact.name}</strong>
                  <div className="muted">{contact.title || "Title not set"}{contact.phone ? ` · ${contact.phone}` : ""}</div>
                </span>
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

function Wallets({ projectId, onAdd, onEdit }: { projectId: string; onAdd: (group: "hot" | "supply") => void; onEdit: (wallet: Wallet) => void }) {
  const { store, project } = useProject(projectId);
  const router = useRouter();
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [dropWallet, setDropWallet] = useState<Wallet | null>(null);
  const [who, setWho] = useState<string | null>(null);
  const hot = project.wallets.filter((wallet) => wallet.group !== "supply");
  const supply = project.wallets.filter((wallet) => wallet.group === "supply");
  const active = project.wallets.find((wallet) => wallet.id === who) || hot[0] || supply[0];
  const market = mockMarket(project.id);
  const held = (wallet: Wallet) => walletHolding(wallet, project, market.marketCap, store.settings.ethUsd, supply.length);
  const book = active ? held(active) : null;
  const total = book && (book.tokenUsd != null || book.ethUsd != null) ? (book.tokenUsd || 0) + (book.ethUsd || 0) : null;
  const open = active ? Boolean(shown[active.id]) : false;
  const key = active?.privateKey || "";
  const list = (rows: Wallet[], empty: string) => rows.length === 0 ? <p className="muted line-empty">{empty}</p> : rows.map((wallet) => {
    const row = held(wallet);
    return (
      <button key={wallet.id} type="button" className={active?.id === wallet.id ? "list-row wallet-row on" : "list-row wallet-row"} onClick={() => setWho(wallet.id)}>
        <span>{wallet.label}</span>
        <span className="tiny">{row.tokens == null ? (wallet.purpose || "—") : formatTokens(row.tokens)}</span>
        <b className="num">{[row.tokenUsd == null ? null : formatCompactUsd(row.tokenUsd), row.share == null ? null : formatShare(row.share)].filter(Boolean).join(" · ") || "Not set"}</b>
      </button>
    );
  });
  return (
    <div className="fit-stack">
      <div className="check-split">
        <div className="wallet-lists">
          <section className="card">
            <div className="spread">
              <h2>Hot wallets</h2>
              <button type="button" className="btn btn-small" onClick={() => onAdd("hot")}>Add</button>
            </div>
            <div className="line-fill">{list(hot, "No hot wallets.")}</div>
          </section>
          <section className="card">
            <div className="spread">
              <h2>Supply wallets</h2>
              <button type="button" className="btn btn-small" onClick={() => onAdd("supply")}>Add</button>
            </div>
            <div className="line-fill">{list(supply, "No supply wallets.")}</div>
          </section>
        </div>
        <section className="card">
          {active ? (
            <>
              <div className="spread">
                <h2>{active.label}</h2>
                <div className="cluster">
                  <span className="tiny">{active.group === "supply" ? "Supply" : "Hot"}</span>
                  <button type="button" className="btn btn-small" onClick={() => onEdit(active)}>Edit</button>
                </div>
              </div>
              <div className="wallet-detail">
                <div className="span-2">
                  <span className="tiny brand-bit">{project.logo ? <img className="mark-logo" src={project.logo} alt="" /> : null}{tickerOf(project.ticker)} held</span>
                  {book && book.tokens != null ? <b className="figure">{formatTokens(book.tokens)}</b> : (
                    <button type="button" className="text-set figure" onClick={() => active.group === "supply" ? router.push(`/projects/${project.id}?tab=desk&phase=startup&step=supply`) : onEdit(active)}>Not set</button>
                  )}
                  <span className="tiny">{book?.share == null ? "Share not set" : `${formatShare(book.share)} of supply${book.tokenUsd == null ? "" : ` · ${formatCompactUsd(book.tokenUsd)}`}`}</span>
                </div>
                <div>
                  <span className="tiny">ETH</span>
                  {book?.eth == null ? (
                    <button type="button" className="text-set figure" onClick={() => active.group === "supply" ? router.push(`/projects/${project.id}?tab=desk&phase=startup&step=supply`) : onEdit(active)}>Not set</button>
                  ) : <b className="figure">{formatEth(book.eth)}</b>}
                  <span className="tiny">{book?.ethUsd == null ? "—" : formatUsd(book.ethUsd)}</span>
                </div>
                <div>
                  <span className="tiny">Value</span>
                  <b className="figure">{total == null ? "Not set" : formatCompactUsd(total)}</b>
                  <span className="tiny">Token and ETH</span>
                </div>
                <div>
                  <span className="tiny">Chain</span>
                  <strong className="brand-bit">{chainLogo(active.chain) && <img className="mark-logo" src={chainLogo(active.chain)} alt="" />}{active.chain || "—"}</strong>
                </div>
                <div>
                  <span className="tiny">Purpose</span>
                  <strong>{active.purpose || "—"}</strong>
                </div>
                <div className="span-2">
                  <span className="tiny">Address</span>
                  {active.address ? <CopyValue text={active.address} mono /> : <button type="button" className="text-set" onClick={() => onEdit(active)}>Not set</button>}
                </div>
                <div className="span-2">
                  <span className="tiny">Key</span>
                  <div className="key-line">
                    <strong className="mono">{open ? (key || "—") : "••••••••"}</strong>
                    <button type="button" className="secret-show" onClick={() => setShown((current) => ({ ...current, [active.id]: !current[active.id] }))}>{open ? "Hide" : "Show"}</button>
                    {key ? <CopyIcon text={key} /> : <button type="button" className="text-set" onClick={() => onEdit(active)}>Not set</button>}
                  </div>
                </div>
              </div>
              <button type="button" className="btn btn-danger" onClick={() => setDropWallet(active)}>Remove</button>
            </>
          ) : <p className="muted line-empty">Add a wallet to see it here.</p>}
        </section>
      </div>
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
  const [who, setWho] = useState<string | null>(null);
  const rows = project.socials || [];
  const active = rows.find((social) => social.id === who) || rows[0];
  const open = active ? Boolean(shown[active.id]) : false;
  const link = active ? href(active.url) : "";
  return (
    <div className="fit-stack">
      <div className="check-split">
        <section className="card">
          <div className="spread">
            <h2>Accounts</h2>
            <button type="button" className="btn btn-small" onClick={onAdd}>Add</button>
          </div>
          <div className="line-fill">
            {rows.length === 0 ? <p className="muted line-empty">No socials.</p> : rows.map((social) => {
              return (
                <button key={social.id} type="button" className={active?.id === social.id ? "list-row seller-row on" : "list-row seller-row"} onClick={() => setWho(social.id)}>
                  <span className="token-logo sm">{hasSocialMark(social.name) ? <SocialMark name={social.name} /> : initials(social.name)}</span>
                  <span>{social.name}</span>
                  <span className="tiny">{social.handle || "—"}</span>
                </button>
              );
            })}
          </div>
        </section>
        <section className="card">
          {active ? (
            <>
              <div className="spread">
                <h2 className="brand-bit"><SocialMark name={active.name} size={18} />{active.name}</h2>
                <div className="cluster">
                  {link ? <a className="btn btn-small" href={link} target="_blank" rel="noreferrer">Open</a> : null}
                  <button type="button" className="btn btn-small" onClick={() => onEdit(active)}>Edit</button>
                </div>
              </div>
              <div className="wallet-detail social-detail">
                <div>
                  <span className="tiny">Handle</span>
                  {active.handle ? <CopyValue text={active.handle} /> : <button type="button" className="text-set" onClick={() => onEdit(active)}>Not set</button>}
                </div>
                <div>
                  <span className="tiny">Network</span>
                  <CopyValue text={active.name} />
                </div>
                <div className="span-2">
                  <span className="tiny">Link</span>
                  {link ? <span className="copy-line"><a href={link} target="_blank" rel="noreferrer" title={active.url}>{link.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a><CopyIcon text={active.url} /></span> : <button type="button" className="text-set" onClick={() => onEdit(active)}>Not set</button>}
                </div>
                <div className="span-2">
                  <span className="tiny">Password</span>
                  <div className="key-line">
                    <strong className="mono">{open ? (active.password || "—") : "••••••••"}</strong>
                    <button type="button" className="secret-show" onClick={() => setShown((current) => ({ ...current, [active.id]: !current[active.id] }))}>{open ? "Hide" : "Show"}</button>
                    {active.password ? <CopyIcon text={active.password} /> : <button type="button" className="text-set" onClick={() => onEdit(active)}>Not set</button>}
                  </div>
                </div>
                <div className="span-2">
                  <span className="tiny">Note</span>
                  <textarea
                    className="note-field"
                    value={active.note}
                    placeholder="Write a note"
                    onChange={(event) => store.updateSocial(project.id, active.id, { note: event.target.value })}
                  />
                </div>
              </div>
              <button type="button" className="btn btn-danger" onClick={() => setDrop(active)}>Remove</button>
            </>
          ) : <p className="muted line-empty">Add a social to see it here.</p>}
        </section>
      </div>
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
  const [drop, setDrop] = useState<string | null>(null);
  const [open, setOpen] = useState<string>("startup");
  const sections = WORK_LANES.map((lane) => ({ id: lane.id, label: lane.label }));
  const current = sections.find((section) => section.id === open) || sections[0];
  const rows = checksInPhase(project, current.id);
  const dropping = project.checks.find((check) => check.id === drop);
  return (
    <div className="fit-stack">
      <div className="check-split">
        <section className="card">
          <h2>Phases</h2>
          <div className="check-phases">
            {sections.map((section) => {
              const all = checksInPhase(project, section.id);
              const done = all.filter((check) => check.done).length;
              return (
                <button key={section.id} type="button" className={current.id === section.id ? "phase-pick on" : "phase-pick"} onClick={() => setOpen(section.id)}>
                  <span>{section.label}</span>
                  <strong>{done}/{all.length}</strong>
                </button>
              );
            })}
          </div>
        </section>
        <section className="card">
          <div className="spread">
            <h2>{current.label}</h2>
            <span className="tiny">{rows.filter((check) => check.done).length}/{rows.length}</span>
          </div>
          <form className="check-add" onSubmit={(event) => {
            event.preventDefault();
            if (!text.trim()) return;
            store.addCheck(project.id, { id: uid("chk"), group: current.label, phase: current.id as PhaseId, text: text.trim(), done: false, critical: false });
            setText("");
          }}>
            <input className="input" placeholder={`Add a checkpoint to ${current.label}`} value={text} onChange={(e) => setText(e.target.value)} />
            <button className="btn btn-small" type="submit">Add</button>
          </form>
          <div className="line-fill">
            {rows.length === 0 ? <p className="muted line-empty">No checks in {current.label} yet.</p> : rows.map((check) => (
              <div key={check.id} className="list-row task">
                <button type="button" className={check.done ? "box on" : "box"} aria-label={check.done ? "Mark open" : "Mark done"} onClick={() => store.toggleCheck(project.id, check.id)} />
                <span>{check.text}</span>
                <button type="button" className="btn btn-small" onClick={() => setDrop(check.id)}>Remove</button>
              </div>
            ))}
          </div>
        </section>
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
  const router = useRouter();
  const quote = projectQuote(project, store.settings);
  const lanes: PhaseId[] = [
    ...WORK_LANES.map((lane) => lane.id),
    ...(quote.rows.some((row) => row.line.phase === "bundle") ? ["bundle" as PhaseId] : []),
  ];
  const amount = (id: PhaseId) => quote.rows.filter((row) => row.line.phase === id).reduce((sum, row) => sum + row.usd, 0);
  const richest = lanes.reduce((best, id) => (amount(id) > amount(best) ? id : best), lanes[0]);
  const [picked, setPicked] = useState<PhaseId | null>(null);
  const [side, setSide] = useState<"spend" | "earned">("spend");
  const [earnNote, setEarnNote] = useState("");
  const [earnAmount, setEarnAmount] = useState("");
  const current = picked && lanes.includes(picked) ? picked : richest;
  const entries = earningEntries(project).filter((item) => item.phase === current);
  const items = quote.rows.filter((row) => row.line.phase === current);
  const addEarning = () => {
    const amountValue = Number(earnAmount.replace(/[^0-9.]/g, ""));
    if (!amountValue) return;
    store.updateProject(project.id, {
      earnings: [...earningEntries(project), { id: uid("earn"), phase: current, amount: amountValue, note: earnNote.trim() }],
    });
    setEarnNote("");
    setEarnAmount("");
  };
  const removeEarning = (id: string) => {
    store.updateProject(project.id, { earnings: earningEntries(project).filter((item) => item.id !== id) });
  };
  const markOf = (line: LineItem) => {
    if (line.source === "package" && line.refId) {
      const pack = byId(store.packages, line.refId);
      if (pack) return packageMark(pack, store.platforms);
    }
    if (line.source === "service" && line.refId) {
      const service = byId(store.services, line.refId);
      if (service) return serviceMark(service, store.platforms);
    }
    const provider = byId(store.providers, line.providerId);
    return provider ? deskMark(provider, store.platforms) : "";
  };
  return (
    <div className="fit-stack">
      <div className="check-split">
        <div className="plan-lists money-lists">
          <section className="card">
            <h2>Phases</h2>
            <div className="line-fill">
              {lanes.map((id) => (
                <button key={id} type="button" className={current === id ? "list-row phase-row on" : "list-row phase-row"} onClick={() => setPicked(id)}>
                  <i className="swatch" style={{ background: PHASE_COLOR[id] }} />
                  <span>{phaseOf(id).label}</span>
                  <b className={side === "earned" && earnedIn(project, id) > 0 ? "num sage" : "num"}>{formatUsd(side === "spend" ? amount(id) : earnedIn(project, id))}</b>
                </button>
              ))}
            </div>
          </section>
          <section className="card">
            <h2>Totals</h2>
            <div className="money-totals">
              <div className="money-lead">
                <div><span className="tiny">Spend</span><strong>{formatUsd(quote.netUsd)}</strong></div>
                <div><span className="tiny">Paid</span><strong className="sage">{formatUsd(quote.paidUsd)}</strong></div>
                <div><span className="tiny">Remaining</span><strong>{formatUsd(quote.balanceUsd)}</strong></div>
              </div>
              <div className="money-grid">
                <Fact label="Budget" text={project.budgetUsd ? formatUsd(project.budgetUsd) : ""} copy={project.budgetUsd ? String(project.budgetUsd) : ""} onSet={() => router.push(editToken(project.id, "budget"))} />
                <div><span className="tiny">Subtotal</span><strong>{formatUsd(quote.subtotalUsd)}</strong></div>
                <div><span className="tiny">Discount</span><strong className="clay">−{formatUsd(quote.discountUsd)}</strong></div>
                <div><span className="tiny">Open</span><strong>{formatUsd(quote.unbilledUsd)}</strong></div>
                <div><span className="tiny">Committed</span><strong>{formatUsd(quote.invoicedUsd)}</strong></div>
                <div><span className="tiny">Covered</span><strong>{formatUsd(quote.compedUsd)}</strong></div>
                {quote.weeklyUsd > 0 && <div><span className="tiny">Weekly</span><strong>{formatUsd(quote.weeklyUsd)}</strong></div>}
                {quote.marginUsd != null && <div><span className="tiny">Margin</span><strong>{formatUsd(quote.marginUsd)}</strong></div>}
              </div>
            </div>
          </section>
        </div>
        <section className="card">
          <h2>{phaseOf(current).label}</h2>
          <div className="phase-money-head" role="tablist">
            <button type="button" role="tab" aria-selected={side === "spend"} className={side === "spend" ? "on" : ""} onClick={() => setSide("spend")}>
              <span className="tiny">Spend</span>
              <strong>{formatUsd(amount(current))}</strong>
            </button>
            <button type="button" role="tab" aria-selected={side === "earned"} className={side === "earned" ? "on" : ""} onClick={() => setSide("earned")}>
              <span className="tiny">Earned</span>
              <strong className={earnedIn(project, current) > 0 ? "sage" : ""}>{formatUsd(earnedIn(project, current))}</strong>
            </button>
          </div>
          {side === "spend" ? (
            <div className="line-fill">
              {items.length === 0 ? <p className="muted line-empty">Nothing posted in this phase.</p> : items.map(({ line, gross }) => {
                const mark = markOf(line);
                const pay = BILLING.find((item) => item.id === line.billing)?.label || "—";
                return (
                  <div key={line.id} className="list-row money-row">
                    <span className="token-logo sm">{mark ? <img src={mark} alt="" /> : initials(line.name)}</span>
                    <span>{line.name}</span>
                    <span className="tiny">{pay}</span>
                    <b className="num">{money(gross, line.currency)}</b>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              <div className="line-fill">
                {entries.length === 0 ? <p className="muted line-empty">No earnings in this phase.</p> : entries.map((entry) => (
                  <div key={entry.id} className="list-row earn-row">
                    <span>{entry.note || "Earning"}</span>
                    <b className="num sage">{formatUsd(entry.amount)}</b>
                    <button type="button" className="btn btn-small" onClick={() => removeEarning(entry.id)}>Remove</button>
                  </div>
                ))}
              </div>
              <form className="earn-add" onSubmit={(event) => { event.preventDefault(); addEarning(); }}>
                <input className="input" placeholder="Note" value={earnNote} onChange={(event) => setEarnNote(event.target.value)} />
                <input className="input" inputMode="decimal" placeholder="Amount" value={earnAmount} onChange={(event) => setEarnAmount(event.target.value.replace(/[^0-9.]/g, ""))} />
                <button className="btn btn-small" type="submit">Add</button>
              </form>
            </>
          )}
        </section>
      </div>
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
  const router = useRouter();
  const quote = projectQuote(project, store.settings);
  const pad = byId(store.platforms, project.launchpadId);
  const status = PROJECT_STATUSES.find((item) => item.id === project.status)?.label || project.status;
  const phaseUsd = (id: PhaseId) => quote.rows.filter((row) => row.line.phase === id).reduce((sum, row) => sum + row.usd, 0);
  return (
    <div className="fit-stack sheet">
      <div className="check-split">
        <div className="plan-lists money-lists">
          <section className="card">
            <h2>Token</h2>
            <div className="summary-facts">
              <Fact label="Owner" text={project.client} onSet={() => router.push(editToken(project.id, "owner"))} />
              <div>
                <span className="tiny">Chain</span>
                <span className="copy-line">
                  <strong className="brand-bit">{chainLogo(project.chain) && <img className="mark-logo" src={chainLogo(project.chain)} alt="" />}{project.chain || "—"}</strong>
                  <CopyIcon text={project.chain} />
                </span>
              </div>
              <div><span className="tiny">Launchpad</span>{pad?.name ? <CopyValue text={pad.name} /> : <strong>—</strong>}</div>
              <Fact label="Target" text={project.targetDate ? formatDay(project.targetDate) : ""} onSet={() => router.push(editToken(project.id, "target"))} />
              <Fact label="Supply" text={project.supply} onSet={() => router.push(editToken(project.id, "supply"))} />
              <div><span className="tiny">Status</span><strong>{status}</strong></div>
              <Fact className="span-3" label="Contract" text={project.contract} mono onSet={() => router.push(editToken(project.id, "contract"))} />
            </div>
            {project.notes && <p className="summary-note">{project.notes}</p>}
          </section>
          <section className="card">
            <h2>Money</h2>
            <div className="money-totals">
              <div className="money-lead">
                <div><span className="tiny">Spend</span><strong>{formatUsd(quote.netUsd)}</strong></div>
                <div><span className="tiny">Paid</span><strong className="sage">{formatUsd(quote.paidUsd)}</strong></div>
                <div><span className="tiny">Remaining</span><strong>{formatUsd(quote.balanceUsd)}</strong></div>
              </div>
              <div className="money-grid">
                <Fact label="Budget" text={project.budgetUsd ? formatUsd(project.budgetUsd) : ""} copy={project.budgetUsd ? String(project.budgetUsd) : ""} onSet={() => router.push(editToken(project.id, "budget"))} />
                <div><span className="tiny">Subtotal</span><strong>{formatUsd(quote.subtotalUsd)}</strong></div>
                <div><span className="tiny">Discount</span><strong className="clay">−{formatUsd(quote.discountUsd)}</strong></div>
                <div><span className="tiny">Open</span><strong>{formatUsd(quote.unbilledUsd)}</strong></div>
                <div><span className="tiny">Committed</span><strong>{formatUsd(quote.invoicedUsd)}</strong></div>
                <div><span className="tiny">Covered</span><strong>{formatUsd(quote.compedUsd)}</strong></div>
              </div>
            </div>
          </section>
        </div>
        <section className="card">
          <h2>Phases</h2>
          <div className="check-phases">
            {WORK_LANES.map((lane) => {
              const checks = checksInPhase(project, lane.id);
              const done = checks.filter((check) => check.done).length;
              return (
                <div key={lane.id} className="phase-pick">
                  <span>{lane.label}</span>
                  <span className="spread">
                    <span className="phase-foot"><span className="tiny">Checklist</span><strong>{done}/{checks.length}</strong></span>
                    <span className="phase-foot"><span className="tiny">Plan</span><strong>{formatUsd(phaseUsd(lane.id))}</strong></span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
