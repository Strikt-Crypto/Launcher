import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { COUNTRIES } from "../lib/labels";
import { money } from "../lib/format";
import { uid } from "../lib/id";
import { servicePriceLabel } from "../lib/price";
import { useStore } from "../store";
import type { LineItem, Package, Service } from "../types";
import { useUi } from "../ui";
import { ChipSelect, Field, Modal, Select } from "./ui";

export function AddToQuote() {
  const store = useStore();
  const ui = useUi();
  const add = ui.add;
  const [projectId, setProjectId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [packageId, setPackageId] = useState("");
  const [tierId, setTierId] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [callers, setCallers] = useState<string[]>([]);
  const [cashtag, setCashtag] = useState("");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("0");
  const [notes, setNotes] = useState("");
  const [weeks, setWeeks] = useState("1");
  const [addRetainer, setAddRetainer] = useState(false);
  const [query, setQuery] = useState("");
  const [picker, setPicker] = useState<"services" | "packages">("services");
  const [error, setError] = useState("");

  const service = store.services.find((item) => item.id === serviceId);
  const pack = store.packages.find((item) => item.id === packageId);
  const choosing = !serviceId && !packageId;

  useEffect(() => {
    if (!add) return;
    setError("");
    setQuery("");
    setPicker("services");
    setProjectId(add.projectId || store.projects[0]?.id || "");
    setNotes("");
    setQty("1");
    setCountries(add.countries || []);
    setCallers(add.callers || []);
    setCashtag("");
    setAddRetainer(false);
    setWeeks("1");
    if (add.serviceId) applyService(add.serviceId, add.tierId);
    else if (add.packageId) applyPackage(add.packageId);
    else {
      setServiceId("");
      setPackageId("");
      setTierId("");
      setPrice("0");
    }
    // Reset only when a new add request opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [add?.nonce]);

  function applyService(id: string, preferred?: string) {
    const next = store.services.find((item) => item.id === id);
    const tier = next?.tiers.find((item) => item.id === preferred) || next?.tiers[0];
    setServiceId(id);
    setPackageId("");
    setTierId(tier?.id || "");
    setPrice(tier ? String(tier.price) : "0");
  }

  function applyPackage(id: string) {
    const next = store.packages.find((item) => item.id === id);
    setPackageId(id);
    setServiceId("");
    setTierId("");
    setPrice(next ? String(next.price) : "0");
  }

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.services.filter((item) => {
      if (item.kind !== "service" || !item.available) return false;
      return !q || `${item.name} ${item.summary}`.toLowerCase().includes(q);
    });
  }, [query, store.services]);

  const filteredPackages = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.packages.filter((item) => !q || item.name.toLowerCase().includes(q));
  }, [query, store.packages]);

  if (!add) return null;

  function submit() {
    if (!projectId) {
      setError("Create a project first.");
      return;
    }
    const amount = Number(price);
    const count = Number(qty);
    if (!Number.isFinite(amount) || amount < 0) {
      setError("Enter a price. Use 0 if it is still open.");
      return;
    }
    if (!Number.isFinite(count) || count <= 0) {
      setError("Quantity has to be above zero.");
      return;
    }
    const weekCount = Number(weeks);
    if (addRetainer && (!Number.isFinite(weekCount) || weekCount <= 0)) {
      setError("Enter the number of weeks.");
      return;
    }

    if (service) {
      const tier = service.tiers.find((item) => item.id === tierId) || service.tiers[0];
      const bits = [tier?.duration || tier?.label || ""].filter(Boolean);
      if (service.countryPick) bits.push(countries.length ? `Worldwide + ${countries.join(", ")}` : "Worldwide");
      if (cashtag.trim()) bits.push(cashtag.trim());
      const phase = add?.phase || service.phase;
      const line: LineItem = {
        id: uid("line"),
        source: "service",
        refId: service.id,
        name: service.name,
        phase,
        detail: bits.join(" · "),
        providerId: service.providerId,
        qty: count,
        unitPrice: amount,
        currency: tier?.currency || "USD",
        status: "planned",
        billing: "unbilled",
        notes: notes.trim(),
        meta: {
          duration: tier?.duration,
          countries: service.countryPick ? countries : undefined,
          cashtag: cashtag.trim() || undefined,
        },
      };
      store.addLine(projectId, line, true);
      if (addRetainer && service.recurring) {
        store.addLine(projectId, {
          id: uid("line"),
          source: "service",
          refId: `${service.id}-mm`,
          name: `${service.name} · ${service.recurring.label}`,
          phase,
          detail: `${weekCount} week${weekCount === 1 ? "" : "s"}`,
          providerId: service.providerId,
          qty: weekCount,
          unitPrice: service.recurring.price,
          currency: service.recurring.currency,
          status: "planned",
          billing: "unbilled",
          notes: "",
          meta: { cadence: service.recurring.every },
        });
      }
    } else if (pack) {
      const chosen = pack.outlets.filter((item) => callers.includes(item.name) && item.price);
      store.addLine(
        projectId,
        {
          id: uid("line"),
          source: "package",
          refId: pack.id,
          name: pack.name,
          phase: add?.phase || pack.phase,
          detail: pack.group === "pr" ? `Tier ${pack.rank}` : pack.id === "artem-tier-1" ? "Narrative & GTM" : "Bundle",
          providerId: pack.providerId,
          qty: count,
          unitPrice: amount,
          currency: pack.currency,
          status: "planned",
          billing: "unbilled",
          notes: notes.trim(),
        },
        true,
      );
      chosen.forEach((item) => {
        store.addLine(projectId, {
          id: uid("line"),
          source: "custom",
          refId: pack.id,
          name: item.name,
          phase: add?.phase || pack.phase,
          detail: [item.group, item.note].filter(Boolean).join(" · "),
          providerId: pack.providerId,
          qty: 1,
          unitPrice: item.price || 0,
          currency: pack.currency,
          status: "planned",
          billing: "unbilled",
          notes: "",
          meta: { caller: item.name },
        });
      });
    } else {
      setError("Choose a service or package.");
      return;
    }

    const project = store.projects.find((item) => item.id === projectId);
    ui.toast(`Added to ${project?.name || "the project"}.`);
    ui.closeAdd();
  }

  return (
    <Modal open wide={choosing} kicker="Plan" title={choosing ? "Add a line" : service?.name || pack?.name || "Add a line"} onClose={ui.closeAdd}>
      {store.projects.length === 0 ? (
        <p>No projects yet. <Link href="/projects/new" onClick={ui.closeAdd}>Start one</Link>.</p>
      ) : (
        <div className="stack">
          <Field label="Project">
            <Select value={projectId} onChange={setProjectId} options={store.projects.map((project) => ({ value: project.id, label: project.name }))} />
          </Field>
          {choosing ? (
            <>
              <div className="cluster">
                <button type="button" className={picker === "services" ? "chip on" : "chip"} onClick={() => setPicker("services")}>Services</button>
                <button type="button" className={picker === "packages" ? "chip on" : "chip"} onClick={() => setPicker("packages")}>Packages</button>
              </div>
              <input className="input" placeholder="Search" value={query} onChange={(event) => setQuery(event.target.value)} />
              <div className="check-scroll" style={{ maxHeight: 320 }}>
                {picker === "services" ? (
                  filteredServices.length === 0 ? <p className="muted line-empty">No services match.</p> : filteredServices.map((item) => (
                    <button key={item.id} type="button" className="list-row" onClick={() => applyService(item.id)}>
                      <span>{item.name}</span>
                      <b className="num">{servicePriceLabel(item)}</b>
                    </button>
                  ))
                ) : filteredPackages.length === 0 ? <p className="muted line-empty">No packages match.</p> : filteredPackages.map((item) => (
                  <button key={item.id} type="button" className="list-row" onClick={() => { applyPackage(item.id); setCallers([]); }}>
                    <span>{item.name}</span>
                    <b className="num">{money(item.price, item.currency)}</b>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <Config
              service={service}
              pack={pack}
              callers={callers}
              setCallers={setCallers}
              tierId={tierId}
              onTier={(id, nextPrice) => { setTierId(id); setPrice(String(nextPrice)); }}
              countries={countries}
              setCountries={setCountries}
              cashtag={cashtag}
              setCashtag={setCashtag}
              qty={qty}
              setQty={setQty}
              price={price}
              setPrice={setPrice}
              notes={notes}
              setNotes={setNotes}
              weeks={weeks}
              setWeeks={setWeeks}
              addRetainer={addRetainer}
              setAddRetainer={setAddRetainer}
            />
          )}
          {error && <p className="clay">{error}</p>}
          <div className="spread">
            {!choosing && !add.serviceId && !add.packageId ? (
              <button type="button" className="btn btn-ghost" onClick={() => { setServiceId(""); setPackageId(""); }}>Back</button>
            ) : <span />}
            <div className="cluster">
              <button type="button" className="btn btn-ghost" onClick={ui.closeAdd}>Cancel</button>
              {!choosing && <button type="button" className="btn btn-primary" onClick={submit}>Add to project</button>}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Config(props: {
  service?: Service;
  pack?: Package;
  callers: string[];
  setCallers: (value: string[]) => void;
  tierId: string;
  onTier: (id: string, price: number) => void;
  countries: string[];
  setCountries: (value: string[]) => void;
  cashtag: string;
  setCashtag: (value: string) => void;
  qty: string;
  setQty: (value: string) => void;
  price: string;
  setPrice: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  weeks: string;
  setWeeks: (value: string) => void;
  addRetainer: boolean;
  setAddRetainer: (value: boolean) => void;
}) {
  const { service, pack } = props;
  const roster = pack?.outlets.filter((item) => item.price) || [];
  const callerSum = roster.filter((item) => props.callers.includes(item.name)).reduce((sum, item) => sum + (item.price || 0), 0);
  const packageAmount = Number(props.price);
  return (
    <div className="stack">
      {service && service.tiers.length > 1 && (
        <div className="cluster">
          {service.tiers.map((tier) => (
            <button key={tier.id} type="button" className={props.tierId === tier.id ? "chip on" : "chip"} onClick={() => props.onTier(tier.id, tier.price)}>
              {tier.label} · {money(tier.price, tier.currency)}
            </button>
          ))}
        </div>
      )}
      {service?.countryPick && (
        <Field label={`Countries · ${props.countries.length}/${service.countryPick.max}`} hint="Worldwide is included.">
          <ChipSelect options={COUNTRIES} value={props.countries} max={service.countryPick.max} onChange={props.setCountries} />
        </Field>
      )}
      {service?.countryPick && (
        <Field label="Cashtag or wording">
          <input className="input" value={props.cashtag} onChange={(event) => props.setCashtag(event.target.value)} placeholder="$TICKER or a phrase" />
        </Field>
      )}
      {service?.recurring && (
        <label className="cluster">
          <input type="checkbox" checked={props.addRetainer} onChange={(event) => props.setAddRetainer(event.target.checked)} />
          Add {service.recurring.label} · {money(service.recurring.price, service.recurring.currency)} / {service.recurring.every}
        </label>
      )}
      {props.addRetainer && (
        <Field label="Weeks">
          <input className="input" value={props.weeks} onChange={(event) => props.setWeeks(event.target.value)} />
        </Field>
      )}
      {roster.length > 0 && (
        <Field label={`Callers · ${props.callers.length}`} hint={callerSum ? money(callerSum, pack?.currency || "USD") : "None selected"}>
          <div className="check-scroll" style={{ maxHeight: 220 }}>
            {roster.map((item) => {
              const on = props.callers.includes(item.name);
              return (
                <button key={item.name} type="button" className={on ? "btn btn-ghost on" : "btn btn-ghost"} style={{ justifyContent: "space-between" }} onClick={() => props.setCallers(on ? props.callers.filter((name) => name !== item.name) : [...props.callers, item.name])}>
                  <span>{item.name}</span>
                  <span>{money(item.price || 0, pack?.currency || "USD")}</span>
                </button>
              );
            })}
          </div>
        </Field>
      )}
      {roster.length > 0 && callerSum > 0 && Number.isFinite(packageAmount) && (
        <p className="tiny">Package {money(packageAmount, pack?.currency || "USD")} + callers {money(callerSum, pack?.currency || "USD")} = {money(packageAmount + callerSum, pack?.currency || "USD")}</p>
      )}
      <div className="form-grid">
        <Field label="Quantity">
          <input className="input" value={props.qty} onChange={(event) => props.setQty(event.target.value)} />
        </Field>
        <Field label={roster.length ? "Package price" : "Unit price"}>
          <input className="input" value={props.price} onChange={(event) => props.setPrice(event.target.value)} />
        </Field>
        <Field label="Notes" className="span-2">
          <textarea className="textarea" value={props.notes} onChange={(event) => props.setNotes(event.target.value)} />
        </Field>
      </div>
    </div>
  );
}
