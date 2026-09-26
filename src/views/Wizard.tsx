"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "@phosphor-icons/react";
import { SupplyPicker } from "../components/SupplyPicker";
import { baselineChecks, makeChecks } from "../lib/checks";
import { formatDay, formatEth, formatEur, money } from "../lib/format";
import { uid, nowIso } from "../lib/id";
import { CHAINS, LAUNCH_KINDS, PHASES, ROUTE_LABEL, launchKindOf } from "../lib/labels";
import { chainLogo } from "../lib/brands";
import { initials, readLogo } from "../lib/logo";
import { packageMark, serviceMark } from "../lib/marks";
import { servicePriceLabel } from "../lib/price";
import { phaseOneShortlist } from "../data/shortlist";
import { SUPPLY_ROWS, emptyTreasury } from "../lib/treasury";
import { useStore } from "../store";
import type { LineItem, PhaseId, Project, SupplyPct, SupplyRoute, Treasury } from "../types";
import { Confirm, Field, Select, Tabs } from "../components/ui";

const STEPS = ["Token", "Scope", "Plan", "Costs", "Review"];

export function Wizard() {
  const store = useStore();
  const router = useRouter();
  const launchpads = store.platforms.filter((item) => item.kind === "launchpad");
  const [step, setStep] = useState(0);
  const [logo, setLogo] = useState("");
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [chain, setChain] = useState("Robinhood");
  const [launchpadId, setLaunchpadId] = useState(launchpads[0]?.id || "");
  const [contract, setContract] = useState("");
  const [supply, setSupply] = useState("");
  const [client, setClient] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [launch, setLaunch] = useState<Project["launch"]>("meme");
  const [utility, setUtility] = useState("");
  const [phases, setPhases] = useState<PhaseId[]>([]);
  const [lines, setLines] = useState<LineItem[]>([]);
  const [dropLine, setDropLine] = useState<LineItem | null>(null);
  const [discount, setDiscount] = useState("0");
  const [discountNote, setDiscountNote] = useState("");
  const [treasury, setTreasury] = useState<Treasury>(emptyTreasury());
  const phaseOptions = PHASES.map((phase) => ({ value: phase.id, label: phase.label }));
  const defaultPhase = phases[0] || PHASES[0].id;
  const pad = launchpads.find((item) => item.id === launchpadId);
  const assigned = new Set(lines.map((line) => line.refId).filter(Boolean));
  const supplyRow = SUPPLY_ROWS.find((row) => row.pct === treasury.supplyPct);
  const supplyEth = supplyRow && treasury.route ? supplyRow[treasury.route] : null;
  const supplyUsd = supplyEth == null ? "" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(supplyEth * store.settings.ethUsd);

  function go(next: number) {
    setStep(next);
  }

  function toggleAssign(id: string, source: "service" | "package") {
    setLines((current) => {
      if (current.some((line) => line.refId === id)) return current.filter((line) => line.refId !== id);
      if (source === "package") {
        const pack = store.packages.find((item) => item.id === id);
        if (!pack) return current;
        return [...current, {
          id: uid("line"),
          source: "package",
          refId: pack.id,
          name: pack.name,
          phase: defaultPhase,
          detail: pack.summary,
          providerId: pack.providerId,
          qty: 1,
          unitPrice: pack.price,
          currency: pack.currency,
          status: "planned",
          billing: "unbilled",
          notes: "",
        }];
      }
      const service = store.services.find((item) => item.id === id);
      if (!service) return current;
      const tier = service.tiers[0];
      const bits = [tier?.duration || tier?.label || ""].filter(Boolean);
      if (service.countryPick) bits.push("Worldwide");
      return [...current, {
        id: uid("line"),
        source: "service",
        refId: service.id,
        name: service.name,
        phase: defaultPhase,
        detail: bits.join(" · "),
        providerId: service.providerId,
        qty: 1,
        unitPrice: tier?.price || 0,
        currency: tier?.currency || "USD",
        status: "planned",
        billing: "unbilled",
        notes: "",
        meta: { duration: tier?.duration },
      }];
    });
  }

  function setLinePhase(id: string, phase: PhaseId) {
    setLines((current) => current.map((line) => line.id === id ? { ...line, phase } : line));
  }

  function loadShortlist() {
    setLines((current) => {
      const have = new Set(current.map((line) => line.refId));
      return [...current, ...phaseOneShortlist().filter((line) => !line.refId || !have.has(line.refId))];
    });
    setDiscount((current) => (Number(current) > 0 ? current : "350"));
    setDiscountNote((current) => current || "Discount");
    if (!phases.includes("phase-1")) setPhases((current) => [...current, "phase-1"]);
  }

  function create() {
    const project: Project = {
      id: uid("proj"),
      name: name.trim(),
      ticker: ticker.trim().replace(/^\$/, ""),
      logo: logo || undefined,
      chain,
      launchpadId,
      contract: contract.trim(),
      supply: supply.trim(),
      status: "draft",
      client: client.trim(),
      budgetUsd: Number(budget) || 0,
      discountUsd: Number(discount) || 0,
      discountNote: discountNote.trim(),
      notes: notes.trim(),
      launch,
      utility: launch === "meme" ? "" : utility.trim(),
      lineItems: lines,
      checks: [...baselineChecks(), ...lines.flatMap((line) => makeChecks(line, store.services, store.packages))],
      wallets: [],
      socials: [],
      logoPacks: [],
      bannerPacks: [],
      contactIds: [],
      treasury,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      targetDate,
    };
    store.addProject(project);
    router.push(`/projects/${project.id}?tab=quote`);
  }

  return (
    <div className="page screen">
      <Tabs className="full" value={String(step)} onChange={(id) => go(Number(id))} tabs={STEPS.map((label, index) => ({ id: String(index), label }))} />
      <div className="desk-fit">
      <div className={`offer-board wizard${step === 0 ? " token" : ""}${step === 3 ? " costs" : ""}${step === 4 ? " review" : ""}${step === 1 && lines.length === 0 ? " one" : ""}`}>
        {step === 0 && (
          <>
            <section className="card form-card">
              <h2>Token</h2>
              <div className="form-stack">
                <div className="form-id">
                  <label className="logo-drop">
                    {logo ? <img src={logo} alt="" /> : <span>Image</span>}
                    <input type="file" accept="image/*" hidden onChange={async (event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (!file) return;
                      setLogo(await readLogo(file));
                    }} />
                  </label>
                  <div className="form-col">
                    <Field label="Token name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
                    <Field label="Ticker"><input className="input" value={ticker} onChange={(e) => setTicker(e.target.value)} /></Field>
                  </div>
                </div>
                <div className="form-row">
                  <Field label="Contract"><input className="input" value={contract} onChange={(e) => setContract(e.target.value)} /></Field>
                  <Field label="Supply"><input className="input" value={supply} onChange={(e) => setSupply(e.target.value)} /></Field>
                </div>
                <div className="form-row">
                  <Field label="Owner"><input className="input" value={client} onChange={(e) => setClient(e.target.value)} /></Field>
                  <Field label="Budget USD"><input className="input" value={budget} onChange={(e) => setBudget(e.target.value)} /></Field>
                </div>
                <Field label="Target date"><input className="input" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></Field>
                {launch !== "meme" && <Field label={launchKindOf(launch).note}><input className="input" value={utility} onChange={(e) => setUtility(e.target.value)} placeholder={launchKindOf(launch).placeholder} /></Field>}
                <Field label="Notes"><textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
                <div className="launch-fit">
                  <h2>Launch</h2>
                  <div className="pick-grid">
                    {LAUNCH_KINDS.map((item) => (
                      <button key={item.id} type="button" className={launch === item.id ? "pick on" : "pick"} onClick={() => setLaunch(item.id)}>
                        <b>{item.group}</b>
                        {launch === item.id ? <Check size={16} weight="bold" /> : <span />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
            <section className="card pick-card chain">
              <h2>Chain</h2>
              <div className="pick-grid chains">
                {CHAINS.map((item) => (
                  <button key={item} type="button" className={chain === item ? "pick on" : "pick"} onClick={() => setChain(item)}>
                    <span className="pick-name"><span className="token-logo sm">{chainLogo(item) ? <img src={chainLogo(item)} alt="" /> : initials(item)}</span><span>{item}</span></span>
                    {chain === item ? <Check size={16} weight="bold" /> : <span />}
                  </button>
                ))}
              </div>
            </section>
            <section className="card pick-card pads">
              <h2>Launchpad</h2>
              <div className="pick-grid pads">
                <button type="button" className={launchpadId === "" ? "pick on" : "pick"} onClick={() => setLaunchpadId("")}>
                  <b>On-chain</b>
                  {launchpadId === "" ? <Check size={16} weight="bold" /> : <span />}
                </button>
                {launchpads.map((item) => (
                  <button key={item.id} type="button" className={launchpadId === item.id ? "pick on" : "pick"} onClick={() => setLaunchpadId(item.id)}>
                    <span className="pick-name"><span className="token-logo sm">{item.logo ? <img src={item.logo} alt="" /> : initials(item.name)}</span><span>{item.name}</span></span>
                    {launchpadId === item.id ? <Check size={16} weight="bold" /> : <span />}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
        {step === 1 && (
          <>
            <section className="card">
              <div className="card-label">
                <h2>Phases</h2>
                {lines.length === 0 && <button type="button" className="btn" onClick={loadShortlist}>Load phase 1</button>}
              </div>
              <div className="pick-grid phases">
                {PHASES.map((phase) => {
                  const on = phases.includes(phase.id);
                  return (
                    <button key={phase.id} type="button" className={on ? "pick on" : "pick"} onClick={() => setPhases((current) => on ? current.filter((id) => id !== phase.id) : [...current, phase.id])}>
                      <span className="pick-name"><span className="tiny">{phase.n}</span><b>{phase.label}</b></span>
                      {on ? <Check size={16} weight="bold" /> : <span />}
                    </button>
                  );
                })}
              </div>
            </section>
            {lines.length > 0 && (
            <section className="card">
              <div className="card-label">
                <h2>Shortlist</h2>
                <button type="button" className="btn" onClick={loadShortlist}>Load phase 1</button>
              </div>
              <div className="line-fill">
                {lines.map((line) => (
                  <div key={line.id} className="list-row plan-line">
                    <span>{line.name}</span>
                    <b className="num">{money(line.unitPrice * line.qty, line.currency)}</b>
                    <button type="button" className="btn btn-small" onClick={() => setDropLine(line)}>Remove</button>
                  </div>
                ))}
              </div>
            </section>
            )}
          </>
        )}
        {step === 2 && (
          <>
            <section className="card">
              <h2>Services</h2>
              <div className="line-fill">
                {store.services.map((service) => {
                  const mark = serviceMark(service, store.platforms);
                  const on = assigned.has(service.id);
                  return (
                    <button key={service.id} type="button" className={on ? "list-row quote on" : "list-row quote"} onClick={() => toggleAssign(service.id, "service")}>
                      <span className="token-logo sm">{mark ? <img src={mark} alt="" /> : initials(service.name)}</span>
                      <span>{service.name}</span>
                      <b className="num">{servicePriceLabel(service)}</b>
                      {on ? <Check size={16} weight="bold" /> : <span />}
                    </button>
                  );
                })}
                {store.packages.map((pack) => {
                  const mark = packageMark(pack, store.platforms);
                  const on = assigned.has(pack.id);
                  return (
                    <button key={pack.id} type="button" className={on ? "list-row quote on" : "list-row quote"} onClick={() => toggleAssign(pack.id, "package")}>
                      <span className="token-logo sm">{mark ? <img src={mark} alt="" /> : initials(pack.name)}</span>
                      <span>{pack.name}</span>
                      <b className="num">{money(pack.price, pack.currency)}</b>
                      {on ? <Check size={16} weight="bold" /> : <span />}
                    </button>
                  );
                })}
              </div>
            </section>
            <section className="card">
              <div className="card-label"><h2>Assigned</h2><b className="num">{lines.length}</b></div>
              <div className="line-fill">
                {lines.length === 0 && <p className="muted line-empty">Nothing assigned.</p>}
                {lines.map((line) => (
                  <div key={line.id} className="list-row plan-line">
                    <span>{line.name}</span>
                    <Select tight label="Phase" value={line.phase} onChange={(value) => setLinePhase(line.id, value as PhaseId)} options={phaseOptions} />
                    <b className="num">{money(line.unitPrice * line.qty, line.currency)}</b>
                    <button type="button" className="btn btn-small" onClick={() => setDropLine(line)}>Remove</button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
        {step === 3 && (
          <>
            <section className="card budget-band">
              <h2>Budgets</h2>
              <div className="budget-grid">
                <Field label="Pre-launch budget EUR"><input className="input" value={treasury.marketingPreEur} onChange={(e) => setTreasury({ ...treasury, marketingPreEur: Number(e.target.value) || 0 })} /></Field>
                <Field label="Phase 1 budget EUR"><input className="input" value={treasury.marketingPhase1Eur} onChange={(e) => setTreasury({ ...treasury, marketingPhase1Eur: Number(e.target.value) || 0 })} /></Field>
                <Field label="Pons launch fee ETH"><input className="input" value={treasury.launchFeeEth} onChange={(e) => setTreasury({ ...treasury, launchFeeEth: Number(e.target.value) || 0 })} /></Field>
                <Field label="Hot wallets"><input className="input" value={treasury.hotWalletsNote} onChange={(e) => setTreasury({ ...treasury, hotWalletsNote: e.target.value })} /></Field>
                <Field label="Volume budget USD"><input className="input" value={treasury.volumeBudgetUsd} onChange={(e) => setTreasury({ ...treasury, volumeBudgetUsd: Number(e.target.value) || 0 })} /></Field>
                <Field label="MM weeks"><input className="input" value={treasury.mmWeeks} onChange={(e) => setTreasury({ ...treasury, mmWeeks: Number(e.target.value) || 0 })} /></Field>
              </div>
            </section>
            <section className="card supply-card">
              <h2>Supply</h2>
              <div className="line-fill">
                <SupplyPicker pct={treasury.supplyPct} route={treasury.route} ethUsd={store.settings.ethUsd} onChange={(pct: SupplyPct, route: SupplyRoute) => setTreasury({ ...treasury, supplyPct: pct, route })} />
              </div>
            </section>
          </>
        )}
        {step === 4 && (
          <>
            <section className="card review-main">
              <h2>Token</h2>
              <div className="review-token">
                <div className="form-stack">
                  <div className="form-id">
                    <div className="logo-drop">{logo ? <img src={logo} alt="" /> : <span>Image</span>}</div>
                    <div className="form-col">
                      <Field label="Token name"><input className="input" value={name} readOnly /></Field>
                      <Field label="Ticker"><input className="input" value={ticker} readOnly /></Field>
                    </div>
                  </div>
                  <div className="form-row">
                    <Field label="Contract"><input className="input" value={contract} readOnly /></Field>
                    <Field label="Supply"><input className="input" value={supply} readOnly /></Field>
                  </div>
                  <div className="form-row">
                    <Field label="Owner"><input className="input" value={client} readOnly /></Field>
                    <Field label="Budget USD"><input className="input" value={budget} readOnly /></Field>
                  </div>
                  <Field label="Target date"><input className="input" value={targetDate ? formatDay(targetDate) : ""} readOnly /></Field>
                  {launch !== "meme" && <Field label={launchKindOf(launch).note}><input className="input" value={utility} readOnly /></Field>}
                  <Field label="Notes"><textarea className="textarea" value={notes} readOnly /></Field>
                </div>
                <div className="review-picks">
                  <div className="review-choice">
                    <h2>Chain</h2>
                    <div className="pick">
                      <span className="token-logo sm">{chainLogo(chain) ? <img src={chainLogo(chain)} alt="" /> : initials(chain)}</span>
                      <b>{chain}</b>
                    </div>
                  </div>
                  <div className="review-choice">
                    <h2>Launchpad</h2>
                    <div className="pick">
                      <span className="token-logo sm">{pad?.logo ? <img src={pad.logo} alt="" /> : initials(pad?.name || "On-chain")}</span>
                      <b>{pad?.name || "On-chain"}</b>
                    </div>
                  </div>
                  <div className="review-choice">
                    <h2>Launch</h2>
                    <div className="pick">
                      <b>{launchKindOf(launch).group}{launch !== "meme" && utility ? ` · ${utility}` : ""}</b>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section className="card review-scope">
              <div className="card-label"><h2>Scope</h2><b className="num">{phases.length}</b></div>
              <div className="line-fill">
                {phases.length === 0 && <p className="muted line-empty">Nothing selected.</p>}
                {PHASES.filter((phase) => phases.includes(phase.id)).map((phase) => (
                  <div key={phase.id} className="list-row field plain">
                    <span className="tiny">{phase.n}</span>
                    <b>{phase.label}</b>
                  </div>
                ))}
              </div>
            </section>
            <section className="card review-plan">
              <div className="card-label"><h2>Plan</h2><b className="num">{lines.length}</b></div>
              <div className="line-fill">
                {lines.length === 0 && <p className="muted line-empty">Nothing assigned.</p>}
                {lines.map((line) => (
                  <div key={line.id} className="list-row plan-line">
                    <span>{line.name}</span>
                    <span className="tiny">{PHASES.find((phase) => phase.id === line.phase)?.label}</span>
                    <b className="num">{money(line.unitPrice * line.qty, line.currency)}</b>
                    <button type="button" className="btn btn-small" onClick={() => setDropLine(line)}>Remove</button>
                  </div>
                ))}
              </div>
            </section>
            <section className="card review-costs">
              <h2>Costs</h2>
              <div className="review-money">
                <div><span>Pre-launch</span><b>{formatEur(treasury.marketingPreEur)}</b></div>
                <div><span>Phase 1</span><b>{formatEur(treasury.marketingPhase1Eur)}</b></div>
                <div><span>Pons fee</span><b>{formatEth(treasury.launchFeeEth)}</b></div>
                <div><span>Hot wallets</span><b>{treasury.hotWalletsNote}</b></div>
                <div><span>Volume</span><b>{money(treasury.volumeBudgetUsd, "USD")}</b></div>
                <div><span>MM weeks</span><b>{treasury.mmWeeks}</b></div>
              </div>
              <div className="list-row field plain">
                <span className="tiny">Supply</span>
                <b>{supplyEth == null || !treasury.route ? "" : `Buy ${treasury.supplyPct}% · ${ROUTE_LABEL[treasury.route]} · ${formatEth(supplyEth)} · ${supplyUsd}`}</b>
              </div>
            </section>
          </>
        )}
        {step > 0 && (
          <section className="card step-nav back">
            <button type="button" className="btn" onClick={() => go(step - 1)}>Back</button>
          </section>
        )}
        <section className="card step-nav next">
          <button type="button" className="btn btn-primary" onClick={step === 4 ? create : () => go(step + 1)}>{step === 4 ? "Create project" : "Continue"}</button>
        </section>
      </div>
      </div>
      <Confirm
        open={dropLine != null}
        title={dropLine ? `Remove ${dropLine.name}?` : "Remove row?"}
        text="It leaves this draft. You can add the service again before you save."
        onConfirm={() => { if (dropLine) setLines((current) => current.filter((item) => item.id !== dropLine.id)); setDropLine(null); }}
        onClose={() => setDropLine(null)}
      />
    </div>
  );
}
