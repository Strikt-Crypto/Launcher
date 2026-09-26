"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SupplyPicker } from "../components/SupplyPicker";
import { baselineChecks, makeChecks } from "../lib/checks";
import { money } from "../lib/format";
import { uid, nowIso } from "../lib/id";
import { CHAINS, COUNTRIES, LAUNCH_KINDS, PHASES, launchKindOf } from "../lib/labels";
import { servicePriceLabel } from "../lib/price";
import { phaseOneShortlist } from "../data/shortlist";
import { emptyTreasury } from "../lib/treasury";
import { useStore } from "../store";
import type { LineItem, PhaseId, Project, SupplyPct, SupplyRoute, Treasury } from "../types";
import { ChipSelect, Confirm, Field, Select } from "../components/ui";

const STEPS = ["Token", "Scope", "Plan", "Costs", "Review"];

export function Wizard() {
  const store = useStore();
  const router = useRouter();
  const launchpads = store.platforms.filter((item) => item.kind === "launchpad");
  const [step, setStep] = useState(0);
  const [tried, setTried] = useState(false);
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
  const [openId, setOpenId] = useState<string | null>(null);
  const [tierId, setTierId] = useState("");
  const [price, setPrice] = useState("0");
  const [countries, setCountries] = useState<string[]>([]);
  const [cashtag, setCashtag] = useState("");

  const valid = name.trim() && ticker.trim();
  const visible = store.services.filter((service) => phases.length === 0 || phases.includes(service.phase));

  function go(next: number) {
    if (next > 0 && !valid) {
      setTried(true);
      setStep(0);
      return;
    }
    setStep(next);
  }

  function addService(serviceId: string) {
    const service = store.services.find((item) => item.id === serviceId);
    if (!service) return;
    const tier = service.tiers.find((item) => item.id === tierId) || service.tiers[0];
    const bits = [tier?.duration || tier?.label || ""].filter(Boolean);
    if (service.countryPick) bits.push(countries.length ? `Worldwide + ${countries.join(", ")}` : "Worldwide");
    if (cashtag.trim()) bits.push(cashtag.trim());
    setLines((current) => [...current, {
      id: uid("line"),
      source: "service",
      refId: service.id,
      name: service.name,
      phase: service.phase,
      detail: bits.join(" · "),
      providerId: service.providerId,
      qty: 1,
      unitPrice: Number(price) || 0,
      currency: tier?.currency || "USD",
      status: "planned",
      billing: "unbilled",
      notes: "",
      meta: { duration: tier?.duration, countries: service.countryPick ? countries : undefined, cashtag: cashtag.trim() || undefined },
    }]);
    setOpenId(null);
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
    if (!valid) {
      setTried(true);
      setStep(0);
      return;
    }
    const project: Project = {
      id: uid("proj"),
      name: name.trim(),
      ticker: ticker.trim().replace(/^\$/, ""),
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
    <div className="page">
      <header className="card desk-head">
        <div className="kicker">New project</div>
        <h1 className="display">Build the worksheet</h1>
        <p className="lede">Name the token, pick the launch type, then the internal plan.</p>
      </header>
      <div className="wizard">
        <div className="wizard-steps" role="tablist">
          {STEPS.map((label, index) => (
            <button key={label} type="button" className={step === index ? "step-btn on" : "step-btn"} onClick={() => go(index)}>
              <span className="tiny">0{index + 1}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div className="card">
          {step === 0 && (
            <div className="form-grid">
              <Field label="Token name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label="Ticker"><input className="input" value={ticker} onChange={(e) => setTicker(e.target.value)} /></Field>
              <Field label="Chain">
                <Select value={chain} onChange={setChain} options={CHAINS.map((item) => ({ value: item, label: item }))} />
              </Field>
              <Field label="Launchpad" hint="A launchpad is a bonding curve. On-chain means the token goes straight on the chain.">
                <Select value={launchpadId} onChange={setLaunchpadId} options={[{ value: "", label: "On-chain" }, ...launchpads.map((item) => ({ value: item.id, label: item.name }))]} />
              </Field>
              <Field label="Contract" className="span-2"><input className="input" value={contract} onChange={(e) => setContract(e.target.value)} /></Field>
              <Field label="Supply"><input className="input" value={supply} onChange={(e) => setSupply(e.target.value)} /></Field>
              <Field label="Launch">
                <Select value={launch} onChange={(value) => setLaunch(value as Project["launch"])} options={LAUNCH_KINDS.map((item) => ({ value: item.id, label: item.group }))} />
              </Field>
              {launch !== "meme" && <Field label={launchKindOf(launch).note}><input className="input" value={utility} onChange={(e) => setUtility(e.target.value)} placeholder={launchKindOf(launch).placeholder} /></Field>}
              <Field label="Owner"><input className="input" value={client} onChange={(e) => setClient(e.target.value)} /></Field>
              <Field label="Budget USD"><input className="input" value={budget} onChange={(e) => setBudget(e.target.value)} /></Field>
              <Field label="Target date"><input className="input" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></Field>
              <Field label="Notes" className="span-2"><textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
              {tried && !valid && <p className="clay span-2">Name and ticker are required.</p>}
            </div>
          )}
          {step === 1 && (
            <div className="stack">
              <p className="muted">Pick the phases this launch will buy. You can still add anything on the next step.</p>
              {PHASES.map((phase) => (
                <button key={phase.id} type="button" className={phases.includes(phase.id) ? "tier-card on" : "tier-card"} onClick={() => setPhases((current) => current.includes(phase.id) ? current.filter((id) => id !== phase.id) : [...current, phase.id])}>
                  <div className="tiny">{phase.n}</div>
                  <strong>{phase.label}</strong>
                  <div className="muted">{phase.hint}</div>
                </button>
              ))}
              <button type="button" className="btn" onClick={loadShortlist}>Load the phase 1 shortlist</button>
            </div>
          )}
          {step === 2 && (
            <div className="stack">
              <div className="form-grid">
                <Field label="Discount USD"><input className="input" value={discount} onChange={(e) => setDiscount(e.target.value)} /></Field>
                <Field label="Discount note"><input className="input" value={discountNote} onChange={(e) => setDiscountNote(e.target.value)} /></Field>
              </div>
              {visible.map((service) => (
                <div key={service.id} className="card">
                  <div className="spread">
                    <div>
                      <strong>{service.name}</strong>
                      <div className="tiny">{servicePriceLabel(service)}</div>
                    </div>
                    <button type="button" className="btn btn-small" onClick={() => {
                      setOpenId(service.id);
                      const tier = service.tiers[0];
                      setTierId(tier?.id || "");
                      setPrice(tier ? String(tier.price) : "0");
                      setCountries([]);
                      setCashtag("");
                    }}>Add</button>
                  </div>
                  {openId === service.id && (
                    <div className="stack" style={{ marginTop: 10 }}>
                      <div className="cluster">
                        {service.tiers.map((tier) => (
                          <button key={tier.id} type="button" className={tierId === tier.id ? "chip on" : "chip"} onClick={() => { setTierId(tier.id); setPrice(String(tier.price)); }}>
                            {tier.label} · {money(tier.price, tier.currency)}
                          </button>
                        ))}
                      </div>
                      {service.countryPick && (
                        <>
                          <ChipSelect options={COUNTRIES} value={countries} max={4} onChange={setCountries} />
                          <input className="input" placeholder="Cashtag or wording" value={cashtag} onChange={(e) => setCashtag(e.target.value)} />
                        </>
                      )}
                      <Field label="Unit price"><input className="input" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
                      <button type="button" className="btn btn-primary" onClick={() => addService(service.id)}>Add line</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {step === 3 && (
            <div className="stack">
              <h2>Pre-launch marketing</h2>
              <Field label="Pre-launch budget EUR"><input className="input" value={treasury.marketingPreEur} onChange={(e) => setTreasury({ ...treasury, marketingPreEur: Number(e.target.value) || 0 })} /></Field>
              <h2>Phase 1 marketing</h2>
              <Field label="Phase 1 budget EUR"><input className="input" value={treasury.marketingPhase1Eur} onChange={(e) => setTreasury({ ...treasury, marketingPhase1Eur: Number(e.target.value) || 0 })} /></Field>
              <h2>Startup</h2>
              <p className="muted">Hot wallets, the launch fee, supply, volume, and market making. These do not sit in the marketing lanes.</p>
              <Field label="Pons launch fee ETH"><input className="input" value={treasury.launchFeeEth} onChange={(e) => setTreasury({ ...treasury, launchFeeEth: Number(e.target.value) || 0 })} /></Field>
              <Field label="Hot wallets"><input className="input" value={treasury.hotWalletsNote} onChange={(e) => setTreasury({ ...treasury, hotWalletsNote: e.target.value })} /></Field>
              <SupplyPicker pct={treasury.supplyPct} route={treasury.route} ethUsd={store.settings.ethUsd} onChange={(pct: SupplyPct, route: SupplyRoute) => setTreasury({ ...treasury, supplyPct: pct, route })} />
              <div className="form-grid">
                <Field label="Volume budget USD" hint="500K / 24H was budgeted at $5,000 plus gas."><input className="input" value={treasury.volumeBudgetUsd} onChange={(e) => setTreasury({ ...treasury, volumeBudgetUsd: Number(e.target.value) || 0 })} /></Field>
                <Field label="MM weeks" hint="$1,000 / week unless you change the rate on the project."><input className="input" value={treasury.mmWeeks} onChange={(e) => setTreasury({ ...treasury, mmWeeks: Number(e.target.value) || 0 })} /></Field>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="stack">
              <p><strong>{name || "Untitled"}</strong> · {ticker} · {chain}</p>
              <p className="muted">{lines.length} lines on the plan</p>
              {lines.map((line) => (
                <div key={line.id} className="spread">
                  <span>{line.name}<span className="tiny"> {line.detail}</span></span>
                  <span className="cluster">
                    <span>{money(line.unitPrice * line.qty, line.currency)}</span>
                    <button type="button" className="btn btn-ghost btn-small" onClick={() => setDropLine(line)}>Remove</button>
                  </span>
                </div>
              ))}
              <button type="button" className="btn btn-primary" onClick={create}>Create project</button>
            </div>
          )}
          <div className="spread" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" disabled={step === 0} onClick={() => go(step - 1)}>Back</button>
            {step < 4 && <button type="button" className="btn btn-primary" onClick={() => go(step + 1)}>Continue</button>}
          </div>
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
