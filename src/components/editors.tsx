import { useEffect, useState, type ReactNode } from "react";
import { BILLING, CHAINS, CURRENCIES, LINE_STATUSES, PHASES, PLATFORM_KINDS, SERVICE_KINDS, SOCIAL_NAMES, WALLET_PURPOSES } from "../lib/labels";
import { uid } from "../lib/id";
import { includesToText, linesOf, linksToText, outletsToText, parseIncludes, parseLinks, parseOutlets, parseRequirements, requirementsToText } from "../lib/text";
import { useStore } from "../store";
import type { Currency, LineItem, Package, PhaseId, Platform, PlatformKind, Project, Provider, Service, ServiceKind, SocialAccount, Wallet } from "../types";
import { ChipSelect, Field, Modal, Select } from "./ui";

function EditorFrame({ page, open, wide, title, kicker, onClose, children }: { page?: boolean; open: boolean; wide?: boolean; title: string; kicker?: string; onClose: () => void; children: ReactNode }) {
  if (page) {
    return (
      <div className="page">
        <div className="topbar">
          <button type="button" className="btn btn-small" onClick={onClose}>Back</button>
          {kicker && <div className="crumb">{kicker}</div>}
        </div>
        <header className="page-head">
          <h1>{title}</h1>
        </header>
        <div className="card record-form">{children}</div>
      </div>
    );
  }
  return <Modal open={open} wide={wide} title={title} kicker={kicker} onClose={onClose}>{children}</Modal>;
}

function useDraft<T>(open: boolean, value: T) {
  const [draft, setDraft] = useState(value);
  const token = open ? JSON.stringify(value) : "";
  useEffect(() => {
    if (open) setDraft(value);
    // value is read from the render that changed `token`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, token]);
  return [draft, setDraft] as const;
}

export function ProviderEditor({ open, initial, onClose }: { open: boolean; initial: Provider | null; onClose: () => void }) {
  const store = useStore();
  const blank: Provider = { id: "", name: "", role: "", about: "", website: "", telegram: "", x: "", discord: "", email: "", region: "" };
  const [draft, setDraft] = useDraft(open, initial || blank);
  const [confirming, setConfirming] = useState(false);
  const set = (patch: Partial<Provider>) => setDraft({ ...draft, ...patch });
  return (
    <Modal open={open} title={confirming ? "Remove this seller?" : initial ? "Edit seller" : "New seller"} kicker="Seller" onClose={onClose}>
      {confirming ? (
        <div className="stack">
          <p>Items that point here will show as unassigned. Plans keep the name they already copied.</p>
          <div className="cluster">
            <button type="button" className="btn btn-danger" onClick={() => { if (initial) store.deleteProvider(initial.id); onClose(); }}>Remove</button>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>Back</button>
          </div>
        </div>
      ) : (
        <form className="stack" onSubmit={(event) => {
          event.preventDefault();
          if (!draft.name.trim()) return;
          const next = { ...draft, name: draft.name.trim() };
          if (initial) store.updateProvider(initial.id, next);
          else store.addProvider({ ...next, id: uid("prov") });
          onClose();
        }}>
          <div className="form-grid">
            <Field label="Name"><input className="input" value={draft.name} onChange={(e) => set({ name: e.target.value })} required /></Field>
            <Field label="Role"><input className="input" value={draft.role} onChange={(e) => set({ role: e.target.value })} /></Field>
            <Field label="Website"><input className="input" value={draft.website} onChange={(e) => set({ website: e.target.value })} /></Field>
            <Field label="Telegram"><input className="input" value={draft.telegram} onChange={(e) => set({ telegram: e.target.value })} /></Field>
            <Field label="X"><input className="input" value={draft.x} onChange={(e) => set({ x: e.target.value })} /></Field>
            <Field label="Discord"><input className="input" value={draft.discord} onChange={(e) => set({ discord: e.target.value })} /></Field>
            <Field label="Email"><input className="input" value={draft.email} onChange={(e) => set({ email: e.target.value })} /></Field>
            <Field label="Region"><input className="input" value={draft.region} onChange={(e) => set({ region: e.target.value })} /></Field>
            <Field label="About" className="span-2"><textarea className="textarea" value={draft.about} onChange={(e) => set({ about: e.target.value })} /></Field>
          </div>
          <div className="spread">
            {initial ? <button type="button" className="btn btn-danger" onClick={() => setConfirming(true)}>Delete</button> : <span />}
            <button className="btn btn-primary" type="submit">Save</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function PlatformEditor({ open, initial, onClose }: { open: boolean; initial: Platform | null; onClose: () => void }) {
  const store = useStore();
  const blank: Platform = { id: "", name: "", kind: "launchpad", chains: [], url: "", notes: "", feeNote: "" };
  const [draft, setDraft] = useDraft(open, initial || blank);
  const [confirming, setConfirming] = useState(false);
  const set = (patch: Partial<Platform>) => setDraft({ ...draft, ...patch });
  return (
    <Modal open={open} title={confirming ? "Remove this platform?" : initial ? "Edit platform" : "New platform"} kicker="Platform" onClose={onClose}>
      {confirming ? (
        <div className="stack">
          <p>Projects using it as a launchpad will need a new selection.</p>
          <div className="cluster">
            <button type="button" className="btn btn-danger" onClick={() => { if (initial) store.deletePlatform(initial.id); onClose(); }}>Remove</button>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>Back</button>
          </div>
        </div>
      ) : (
        <form className="stack" onSubmit={(event) => {
          event.preventDefault();
          if (!draft.name.trim()) return;
          if (initial) store.updatePlatform(initial.id, { ...draft, name: draft.name.trim() });
          else store.addPlatform({ ...draft, id: uid("plat"), name: draft.name.trim() });
          onClose();
        }}>
          <div className="form-grid">
            <Field label="Name"><input className="input" value={draft.name} onChange={(e) => set({ name: e.target.value })} required /></Field>
            <Field label="Kind">
              <Select value={draft.kind} onChange={(value) => set({ kind: value as PlatformKind })} options={PLATFORM_KINDS.map((kind) => ({ value: kind.id, label: kind.label }))} />
            </Field>
            <Field label="URL"><input className="input" value={draft.url} onChange={(e) => set({ url: e.target.value })} /></Field>
            <Field label="Fee note"><input className="input" value={draft.feeNote} onChange={(e) => set({ feeNote: e.target.value })} /></Field>
            <Field label="Notes" className="span-2"><textarea className="textarea" value={draft.notes} onChange={(e) => set({ notes: e.target.value })} /></Field>
          </div>
          <Field label="Chains"><ChipSelect options={[...new Set([...CHAINS, ...draft.chains])]} value={draft.chains} onChange={(chains) => set({ chains })} /></Field>
          <div className="spread">
            {initial ? <button type="button" className="btn btn-danger" onClick={() => setConfirming(true)}>Delete</button> : <span />}
            <button className="btn btn-primary" type="submit">Save</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function ServiceEditor({ open, initial, onClose, page }: { open: boolean; initial: Service | null; onClose: () => void; page?: boolean }) {
  const store = useStore();
  const [name, setName] = useState("");
  const [phase, setPhase] = useState<PhaseId>("phase-1");
  const [kind, setKind] = useState<ServiceKind>("service");
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [providerId, setProviderId] = useState("house");
  const [newProvider, setNewProvider] = useState("");
  const [available, setAvailable] = useState(true);
  const [openPrice, setOpenPrice] = useState(false);
  const [countryPick, setCountryPick] = useState(false);
  const [platformIds, setPlatformIds] = useState<string[]>([]);
  const [platformQuery, setPlatformQuery] = useState("");
  const [tierLabel, setTierLabel] = useState("Standard");
  const [tierPrice, setTierPrice] = useState("0");
  const [tierCurrency, setTierCurrency] = useState<Currency>("USD");
  const [tierDuration, setTierDuration] = useState("");
  const [requirements, setRequirements] = useState("");
  const [rules, setRules] = useState("");
  const [includes, setIncludes] = useState("");
  const [links, setLinks] = useState("");
  const [recLabel, setRecLabel] = useState("");
  const [recPrice, setRecPrice] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) return;
    setConfirming(false);
    setName(initial?.name || "");
    setPhase(initial?.phase || "phase-1");
    setKind(initial?.kind || "service");
    setSummary(initial?.summary || "");
    setDetails(initial?.details || "");
    setProviderId(initial?.providerId || store.providers[0]?.id || "house");
    setNewProvider("");
    setAvailable(initial?.available ?? true);
    setOpenPrice(Boolean(initial?.openPrice));
    setCountryPick(Boolean(initial?.countryPick));
    setPlatformIds(initial?.platformIds || []);
    setTierLabel(initial?.tiers[0]?.label || "Standard");
    setTierPrice(String(initial?.tiers[0]?.price ?? 0));
    setTierCurrency(initial?.tiers[0]?.currency || "USD");
    setTierDuration(initial?.tiers[0]?.duration || "");
    setRequirements(initial ? requirementsToText(initial.requirements) : "");
    setRules(initial?.rules.join("\n") || "");
    setIncludes(initial ? includesToText(initial.includes) : "");
    setLinks(initial ? linksToText(initial.links) : "");
    setRecLabel(initial?.recurring?.label || "");
    setRecPrice(initial?.recurring ? String(initial.recurring.price) : "");
  }, [open, initial, store.providers]);

  function save() {
    let nextProvider = providerId;
    if (newProvider.trim()) {
      nextProvider = uid("prov");
      store.addProvider({ id: nextProvider, name: newProvider.trim(), role: "Seller", about: "", website: "", telegram: "", x: "", discord: "", email: "", region: "" });
    }
    const tiers = initial && initial.tiers.length > 1
      ? initial.tiers.map((tier, index) => index === 0 ? { ...tier, label: tierLabel || "Standard", price: Number(tierPrice) || 0, currency: tierCurrency, duration: tierDuration || undefined } : tier)
      : [{ id: initial?.tiers[0]?.id || "standard", label: tierLabel || "Standard", price: Number(tierPrice) || 0, currency: tierCurrency, duration: tierDuration || undefined }];
    const rec = recLabel.trim() && Number(recPrice) > 0
      ? { every: "week" as const, price: Number(recPrice), currency: "USD" as const, label: recLabel.trim() }
      : undefined;
    const next: Omit<Service, "id"> = {
      name: name.trim(),
      phase, kind, summary, details,
      providerId: nextProvider,
      available, openPrice,
      countryPick: countryPick ? { max: 4, includesWorldwide: true } : undefined,
      platformIds,
      tiers,
      requirements: parseRequirements(requirements),
      rules: linesOf(rules),
      includes: parseIncludes(includes),
      links: parseLinks(links),
      chains: initial?.chains || [],
      recurring: rec,
    };
    if (initial) store.updateService(initial.id, next);
    else store.addService({ ...next, id: uid("svc") });
    onClose();
  }

  const visiblePlatforms = store.platforms.filter((item) => item.name.toLowerCase().includes(platformQuery.toLowerCase()));

  return (
    <EditorFrame page={page} open={open} wide title={confirming ? "Remove this service?" : initial ? "Edit service" : "New service"} kicker="Catalog" onClose={onClose}>
      {confirming ? (
        <div className="stack">
          <p>Existing quote rows stay. They are copies.</p>
          <div className="cluster">
            <button type="button" className="btn btn-danger" onClick={() => { if (initial) store.deleteService(initial.id); onClose(); }}>Remove</button>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>Back</button>
          </div>
        </div>
      ) : (
        <div className="stack">
          <div className="form-grid">
            <Field label="Name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Phase">
              <Select value={phase} onChange={(value) => setPhase(value as PhaseId)} options={PHASES.map((item) => ({ value: item.id, label: item.label }))} />
            </Field>
            <Field label="Kind">
              <Select value={kind} onChange={(value) => setKind(value as ServiceKind)} options={SERVICE_KINDS.map((item) => ({ value: item.id, label: item.label }))} />
            </Field>
            <Field label="Seller">
              <Select value={providerId} onChange={setProviderId} options={store.providers.map((item) => ({ value: item.id, label: item.name }))} />
            </Field>
            <Field label="Or a new seller name" className="span-2"><input className="input" value={newProvider} onChange={(e) => setNewProvider(e.target.value)} placeholder="Leave blank to use the seller above" /></Field>
            <Field label="Summary" className="span-2"><input className="input" value={summary} onChange={(e) => setSummary(e.target.value)} /></Field>
            <Field label="Details" className="span-2"><textarea className="textarea" value={details} onChange={(e) => setDetails(e.target.value)} /></Field>
            <Field label="First tier label"><input className="input" value={tierLabel} onChange={(e) => setTierLabel(e.target.value)} /></Field>
            <Field label="Price"><input className="input" value={tierPrice} onChange={(e) => setTierPrice(e.target.value)} /></Field>
            <Field label="Currency">
              <Select value={tierCurrency} onChange={(value) => setTierCurrency(value as Currency)} options={CURRENCIES.map((item) => ({ value: item, label: item }))} />
            </Field>
            <Field label="Duration"><input className="input" value={tierDuration} onChange={(e) => setTierDuration(e.target.value)} /></Field>
            <Field label="Requirements" hint="One per line. Start a line with ! to mark it critical." className="span-2">
              <textarea className="textarea" value={requirements} onChange={(e) => setRequirements(e.target.value)} />
            </Field>
            <Field label="Rules" hint="One per line." className="span-2"><textarea className="textarea" value={rules} onChange={(e) => setRules(e.target.value)} /></Field>
            <Field label="Includes" hint="Label | url | note" className="span-2"><textarea className="textarea" value={includes} onChange={(e) => setIncludes(e.target.value)} /></Field>
            <Field label="Links" hint="Label | url" className="span-2"><textarea className="textarea" value={links} onChange={(e) => setLinks(e.target.value)} /></Field>
            <Field label="Weekly add-on label"><input className="input" value={recLabel} onChange={(e) => setRecLabel(e.target.value)} /></Field>
            <Field label="Weekly price USD"><input className="input" value={recPrice} onChange={(e) => setRecPrice(e.target.value)} /></Field>
          </div>
          <label className="cluster"><input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} /> Available</label>
          <label className="cluster"><input type="checkbox" checked={openPrice} onChange={(e) => setOpenPrice(e.target.checked)} /> Price is open until set on a quote</label>
          <label className="cluster"><input type="checkbox" checked={countryPick} onChange={(e) => setCountryPick(e.target.checked)} /> Ask for up to 4 countries; worldwide included</label>
          <Field label="Platforms">
            <input className="input" placeholder="Filter platforms" value={platformQuery} onChange={(e) => setPlatformQuery(e.target.value)} />
            <div className="check-scroll">
              {visiblePlatforms.map((item) => (
                <label key={item.id} className="cluster">
                  <input type="checkbox" checked={platformIds.includes(item.id)} onChange={() => setPlatformIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} />
                  {item.name}
                </label>
              ))}
            </div>
          </Field>
          {initial && initial.tiers.length > 1 && <p className="hint">This editor updates the first tier. Extra tiers stay as they are.</p>}
          <div className="spread">
            {initial ? <button type="button" className="btn btn-danger" onClick={() => setConfirming(true)}>Delete</button> : <span />}
            <button type="button" className="btn btn-primary" disabled={!name.trim()} onClick={save}>Save</button>
          </div>
        </div>
      )}
    </EditorFrame>
  );
}

export function PackageEditor({ open, initial, onClose, page }: { open: boolean; initial: Package | null; onClose: () => void; page?: boolean }) {
  const store = useStore();
  const blank: Package = { id: "", name: "", rank: store.packages.length + 1, group: "pr", phase: "phase-3", price: 0, currency: "USD", summary: "", guarantees: [], outlets: [], extras: [], providerId: "pr-desk", includes: [] };
  const [draft, setDraft] = useDraft(open, initial || blank);
  const [guarantees, setGuarantees] = useState("");
  const [extras, setExtras] = useState("");
  const [outletText, setOutletText] = useState("");
  const [includeText, setIncludeText] = useState("");
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (!open) return;
    setConfirming(false);
    setGuarantees((initial?.guarantees || []).join("\n"));
    setExtras((initial?.extras || []).join("\n"));
    setOutletText(initial ? outletsToText(initial.outlets) : "");
    setIncludeText(initial ? includesToText(initial.includes) : "");
  }, [open, initial]);
  const set = (patch: Partial<Package>) => setDraft({ ...draft, ...patch });
  return (
    <EditorFrame page={page} open={open} wide title={confirming ? "Remove this package?" : initial ? "Edit package" : "New package"} kicker="Package" onClose={onClose}>
      {confirming ? (
        <div className="cluster">
          <button type="button" className="btn btn-danger" onClick={() => { if (initial) store.deletePackage(initial.id); onClose(); }}>Remove</button>
          <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>Back</button>
        </div>
      ) : (
        <div className="stack">
          <div className="form-grid">
            <Field label="Name"><input className="input" value={draft.name} onChange={(e) => set({ name: e.target.value })} /></Field>
            <Field label="Group">
              <Select value={draft.group} onChange={(value) => set({ group: value as Package["group"], phase: value === "bundle" ? "bundle" : "phase-3" })} options={[{ value: "pr", label: "PR ladder" }, { value: "bundle", label: "Bundle" }]} />
            </Field>
            <Field label="Rank"><input className="input" value={draft.rank} onChange={(e) => set({ rank: Number(e.target.value) || 0 })} /></Field>
            <Field label="Price"><input className="input" value={draft.price} onChange={(e) => set({ price: Number(e.target.value) || 0 })} /></Field>
            <Field label="Seller">
              <Select value={draft.providerId} onChange={(value) => set({ providerId: value })} options={store.providers.map((item) => ({ value: item.id, label: item.name }))} />
            </Field>
            <Field label="Summary" className="span-2"><input className="input" value={draft.summary} onChange={(e) => set({ summary: e.target.value })} /></Field>
            <Field label="Guarantees" className="span-2"><textarea className="textarea" value={guarantees} onChange={(e) => setGuarantees(e.target.value)} /></Field>
            <Field label="Extras" className="span-2"><textarea className="textarea" value={extras} onChange={(e) => setExtras(e.target.value)} /></Field>
            <Field label="Outlets" hint="Name | url" className="span-2"><textarea className="textarea" value={outletText} onChange={(e) => setOutletText(e.target.value)} /></Field>
            <Field label="Includes" hint="Label | url" className="span-2"><textarea className="textarea" value={includeText} onChange={(e) => setIncludeText(e.target.value)} /></Field>
          </div>
          <div className="spread">
            {initial ? <button type="button" className="btn btn-danger" onClick={() => setConfirming(true)}>Delete</button> : <span />}
            <button type="button" className="btn btn-primary" disabled={!draft.name.trim()} onClick={() => {
              const next = { ...draft, name: draft.name.trim(), guarantees: linesOf(guarantees), extras: linesOf(extras), outlets: parseOutlets(outletText), includes: parseIncludes(includeText) };
              if (initial) store.updatePackage(initial.id, next);
              else store.addPackage({ ...next, id: uid("pkg") });
              onClose();
            }}>Save</button>
          </div>
        </div>
      )}
    </EditorFrame>
  );
}

export function LineEditor({ open, project, line, onClose }: { open: boolean; project: Project; line: LineItem | null; onClose: () => void }) {
  const store = useStore();
  const blank: LineItem = { id: "", source: "custom", name: "", phase: "phase-1", detail: "", providerId: store.providers[0]?.id, qty: 1, unitPrice: 0, currency: "USD", status: "planned", billing: "unbilled", notes: "" };
  const [draft, setDraft] = useDraft(open, line || blank);
  const set = (patch: Partial<LineItem>) => setDraft({ ...draft, ...patch });
  return (
    <Modal open={open} title={line ? "Edit row" : "Custom row"} kicker="Plan" onClose={onClose}>
      <form className="stack" onSubmit={(event) => {
        event.preventDefault();
        if (!draft.name.trim()) return;
        if (line) store.updateLine(project.id, line.id, { ...draft, name: draft.name.trim() });
        else store.addLine(project.id, { ...draft, id: uid("line"), source: "custom", name: draft.name.trim() });
        onClose();
      }}>
        <div className="form-grid">
          <Field label="Name" className="span-2"><input className="input" value={draft.name} onChange={(e) => set({ name: e.target.value })} required /></Field>
          <Field label="Phase">
            <Select value={draft.phase} onChange={(value) => set({ phase: value as PhaseId })} options={PHASES.map((item) => ({ value: item.id, label: item.label }))} />
          </Field>
          <Field label="Seller">
            <Select value={draft.providerId || ""} onChange={(value) => set({ providerId: value })} options={store.providers.map((item) => ({ value: item.id, label: item.name }))} />
          </Field>
          <Field label="Detail" className="span-2"><input className="input" value={draft.detail} onChange={(e) => set({ detail: e.target.value })} /></Field>
          <Field label="Qty"><input className="input" value={draft.qty} onChange={(e) => set({ qty: Number(e.target.value) || 0 })} /></Field>
          <Field label="Unit price"><input className="input" value={draft.unitPrice} onChange={(e) => set({ unitPrice: Number(e.target.value) || 0 })} /></Field>
          <Field label="Currency">
            <Select value={draft.currency} onChange={(value) => set({ currency: value as Currency })} options={CURRENCIES.map((item) => ({ value: item, label: item }))} />
          </Field>
          <Field label="Vendor cost" hint="Optional. Unlocks margin.">
            <input className="input" value={draft.unitCost ?? ""} onChange={(e) => set({ unitCost: e.target.value === "" ? undefined : Number(e.target.value) })} />
          </Field>
          <Field label="Status">
            <Select value={draft.status} onChange={(value) => set({ status: value as LineItem["status"] })} options={LINE_STATUSES.map((item) => ({ value: item.id, label: item.label }))} />
          </Field>
          <Field label="Payment">
            <Select value={draft.billing} onChange={(value) => set({ billing: value as LineItem["billing"] })} options={BILLING.map((item) => ({ value: item.id, label: item.label }))} />
          </Field>
          <Field label="Notes" className="span-2"><textarea className="textarea" value={draft.notes} onChange={(e) => set({ notes: e.target.value })} /></Field>
        </div>
        <div className="spread">
          <span />
          <button className="btn btn-primary" type="submit">Save row</button>
        </div>
      </form>
    </Modal>
  );
}

export function WalletEditor({ open, project, wallet, onClose }: { open: boolean; project: Project; wallet: Wallet | null; onClose: () => void }) {
  const store = useStore();
  const blank: Wallet = { id: "", label: "", address: "", chain: project.chain, purpose: "Execution", privateKey: "" };
  const [draft, setDraft] = useDraft(open, wallet || blank);
  const [reveal, setReveal] = useState(false);
  useEffect(() => { if (open) setReveal(false); }, [open, wallet?.id]);
  const set = (patch: Partial<Wallet>) => setDraft({ ...draft, ...patch });
  return (
    <Modal open={open} title={wallet ? "Edit wallet" : "Add wallet"} kicker="Treasury" onClose={onClose}>
      <form className="stack" onSubmit={(event) => {
        event.preventDefault();
        if (!draft.label.trim()) return;
        const next = { ...draft, label: draft.label.trim(), privateKey: draft.privateKey || "" };
        if (wallet) store.updateWallet(project.id, wallet.id, next);
        else store.addWallet(project.id, { ...next, id: uid("wal") });
        onClose();
      }}>
        <Field label="Label"><input className="input" value={draft.label} onChange={(e) => set({ label: e.target.value })} required /></Field>
        <Field label="Address"><input className="input" value={draft.address} onChange={(e) => set({ address: e.target.value })} placeholder="Leave blank if still TBD" autoComplete="off" /></Field>
        <Field label="Private key">
          <input className="input" type={reveal ? "text" : "password"} value={draft.privateKey || ""} onChange={(e) => set({ privateKey: e.target.value })} placeholder="Optional" autoComplete="off" spellCheck={false} />
        </Field>
        <button type="button" className="btn btn-small" onClick={() => setReveal((value) => !value)}>{reveal ? "Hide key" : "Show key"}</button>
        <Field label="Chain">
          <Select value={draft.chain} onChange={(value) => set({ chain: value })} options={CHAINS.map((chain) => ({ value: chain, label: chain }))} />
        </Field>
        <Field label="Purpose">
          <Select value={draft.purpose} onChange={(value) => set({ purpose: value })} options={WALLET_PURPOSES.map((item) => ({ value: item, label: item }))} />
        </Field>
        <button className="btn btn-primary" type="submit">Save wallet</button>
      </form>
    </Modal>
  );
}

export function SocialEditor({ open, project, social, onClose }: { open: boolean; project: Project; social: SocialAccount | null; onClose: () => void }) {
  const store = useStore();
  const blank: SocialAccount = { id: "", name: "", url: "", handle: "", password: "", note: "" };
  const [draft, setDraft] = useDraft(open, social || blank);
  const [reveal, setReveal] = useState(false);
  useEffect(() => { if (open) setReveal(false); }, [open, social?.id]);
  const set = (patch: Partial<SocialAccount>) => setDraft({ ...draft, ...patch });
  return (
    <Modal open={open} title={social ? "Edit social" : "Add social"} kicker="Socials" onClose={onClose}>
      <form className="stack" onSubmit={(event) => {
        event.preventDefault();
        if (!draft.name.trim()) return;
        const next = { ...draft, name: draft.name.trim(), url: draft.url.trim(), handle: draft.handle.trim(), password: draft.password || "", note: draft.note.trim() };
        if (social) store.updateSocial(project.id, social.id, next);
        else store.addSocial(project.id, { ...next, id: uid("soc") });
        onClose();
      }}>
        <div className="cluster">
          {SOCIAL_NAMES.map((name) => (
            <button key={name} type="button" className={draft.name === name ? "chip on" : "chip"} onClick={() => set({ name })}>{name}</button>
          ))}
        </div>
        <Field label="Name"><input className="input" value={draft.name} onChange={(e) => set({ name: e.target.value })} required /></Field>
        <Field label="Link"><input className="input" value={draft.url} onChange={(e) => set({ url: e.target.value })} placeholder="https://" autoComplete="off" /></Field>
        <Field label="Handle"><input className="input" value={draft.handle} onChange={(e) => set({ handle: e.target.value })} placeholder="@name or email" autoComplete="off" /></Field>
        <Field label="Password">
          <input className="input" type={reveal ? "text" : "password"} value={draft.password || ""} onChange={(e) => set({ password: e.target.value })} placeholder="Optional" autoComplete="off" spellCheck={false} />
        </Field>
        <button type="button" className="btn btn-small" onClick={() => setReveal((value) => !value)}>{reveal ? "Hide password" : "Show password"}</button>
        <Field label="Note"><input className="input" value={draft.note} onChange={(e) => set({ note: e.target.value })} placeholder="Recovery, 2FA, who holds it" /></Field>
        <button className="btn btn-primary" type="submit">Save social</button>
      </form>
    </Modal>
  );
}

export function BriefEditor({ open, embedded, project, onClose }: { open?: boolean; embedded?: boolean; project: Project; onClose: () => void }) {
  const store = useStore();
  const [draft, setDraft] = useDraft(Boolean(open || embedded), project);
  const set = (patch: Partial<Project>) => setDraft({ ...draft, ...patch });
  const launchpads = store.platforms.filter((item) => item.kind === "launchpad");
  const form = (
      <form className="stack" onSubmit={(event) => {
        event.preventDefault();
        store.updateProject(project.id, {
          name: draft.name.trim(),
          ticker: draft.ticker.trim().replace(/^\$/, ""),
          chain: draft.chain,
          launchpadId: draft.launchpadId,
          contract: draft.contract.trim(),
          supply: draft.supply.trim(),
          client: draft.client.trim(),
          status: draft.status,
          budgetUsd: Number(draft.budgetUsd) || 0,
          targetDate: draft.targetDate,
          notes: draft.notes,
        });
        onClose();
      }}>
        <div className="form-grid">
          <Field label="Token"><input className="input" value={draft.name} onChange={(e) => set({ name: e.target.value })} required /></Field>
          <Field label="Ticker"><input className="input" value={draft.ticker} onChange={(e) => set({ ticker: e.target.value })} /></Field>
          <Field label="Chain">
            <Select value={draft.chain} onChange={(value) => set({ chain: value })} options={CHAINS.map((chain) => ({ value: chain, label: chain }))} />
          </Field>
          <Field label="Launchpad">
            <Select value={draft.launchpadId} onChange={(value) => set({ launchpadId: value })} options={launchpads.map((item) => ({ value: item.id, label: item.name }))} />
          </Field>
          <Field label="Contract" className="span-2"><input className="input" value={draft.contract} onChange={(e) => set({ contract: e.target.value })} /></Field>
          <Field label="Supply"><input className="input" value={draft.supply} onChange={(e) => set({ supply: e.target.value })} /></Field>
          <Field label="Owner"><input className="input" value={draft.client} onChange={(e) => set({ client: e.target.value })} /></Field>
          <Field label="Budget USD"><input className="input" value={draft.budgetUsd} onChange={(e) => set({ budgetUsd: Number(e.target.value) || 0 })} /></Field>
          <Field label="Target date"><input className="input" type="date" value={draft.targetDate} onChange={(e) => set({ targetDate: e.target.value })} /></Field>
          <Field label="Notes" className="span-2"><textarea className="textarea" value={draft.notes} onChange={(e) => set({ notes: e.target.value })} /></Field>
        </div>
        <button className="btn btn-primary" type="submit">Save token</button>
      </form>
  );
  if (embedded) return <section className="card record-form">{form}</section>;
  return (
    <Modal open={Boolean(open)} title="Edit token" kicker={project.ticker || "Project"} onClose={onClose}>
      {form}
    </Modal>
  );
}

export function DiscountEditor({ open, project, onClose }: { open: boolean; project: Project; onClose: () => void }) {
  const store = useStore();
  const [amount, setAmount] = useState(String(project.discountUsd));
  const [note, setNote] = useState(project.discountNote);
  useEffect(() => {
    if (!open) return;
    setAmount(String(project.discountUsd));
    setNote(project.discountNote);
  }, [open, project.discountUsd, project.discountNote]);
  return (
    <Modal open={open} title="Discount" kicker="Plan" onClose={onClose}>
      <form className="stack" onSubmit={(event) => {
        event.preventDefault();
        store.updateProject(project.id, { discountUsd: Number(amount) || 0, discountNote: note.trim() });
        onClose();
      }}>
        <Field label="Amount off, USD"><input className="input" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="Note"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <button className="btn btn-primary" type="submit">Apply</button>
      </form>
    </Modal>
  );
}
