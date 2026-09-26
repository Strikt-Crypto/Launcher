import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, SquaresFour, Table, X } from "@phosphor-icons/react";
import { cx } from "../lib/format";
import { PHASE_COLOR, phaseOf } from "../lib/labels";
import { formatUsd } from "../lib/format";
import type { PhaseId } from "../types";

export function PageHead({ kicker, title, lede, actions }: { kicker?: string; title: string; lede?: string; actions?: ReactNode }) {
  return (
    <header className="page-head">
      {kicker && <div className="kicker">{kicker}</div>}
      <h1 className="display">{title}</h1>
      {lede && <p className="lede">{lede}</p>}
      {actions && <div className="desk-head-actions">{actions}</div>}
    </header>
  );
}

export function Section({ kicker, title, action, children }: { kicker?: string; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="section">
      <div className="section-head">
        <div>
          {kicker && <div className="kicker">{kicker}</div>}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function CopyIcon({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  const value = text.trim();
  if (!value || value === "—" || value === "Not set") return null;
  return (
    <button
      type="button"
      className="copy-icon"
      aria-label={done ? "Copied" : "Copy"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void navigator.clipboard.writeText(value).then(() => {
          setDone(true);
          window.setTimeout(() => setDone(false), 900);
        }).catch(() => {});
      }}
    >
      {done ? <Check size={13} weight="bold" /> : <Copy size={13} />}
    </button>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx("field", className)}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

export function Modal({ open, title, kicker, wide, onClose, children }: { open: boolean; title: string; kicker?: string; wide?: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-back" onMouseDown={onClose}>
      <div className={cx("modal", wide && "wide")} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-top">
          <div>
            {kicker && <div className="kicker">{kicker}</div>}
            <h2>{title}</h2>
          </div>
          <button type="button" className="icon-x" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Confirm({ open, title, text, confirm = "Remove", onConfirm, onClose }: { open: boolean; title: string; text: string; confirm?: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="stack">
        <p className="muted">{text}</p>
        <div className="cluster">
          <button type="button" className="btn btn-danger" onClick={onConfirm}>{confirm}</button>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}

export function Tabs({ tabs, value, onChange, className }: { tabs: { id: string; label: string; count?: number; icon?: ComponentType<{ size?: number; weight?: "regular" | "fill" }> }[]; value: string; onChange: (id: string) => void; className?: string }) {
  return (
    <div className={cx("tabs", className)} role="tablist">
      {tabs.map((tab) => (
        <button key={tab.id} type="button" role="tab" aria-selected={value === tab.id} className={cx("tab", value === tab.id && "on")} onClick={() => onChange(tab.id)}>
          {tab.icon ? <tab.icon size={16} weight={value === tab.id ? "fill" : "regular"} /> : null}
          {tab.label}
          {tab.count != null ? <span className="tab-count">{tab.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Pill({ tone, children }: { tone?: string; children: ReactNode }) {
  return <span className={cx("pill", tone)}>{children}</span>;
}

export function Empty({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p className="muted">{text}</p>
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}

export function Menu({ label = "More", items }: { label?: string; items: { label: string; onClick: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (!open) return;
    const layout = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      setPlace({ top: rect.bottom + 8, left: Math.max(8, rect.right - 180) });
    };
    layout();
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (trigger.current?.contains(target) || pop.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("resize", layout);
    window.addEventListener("scroll", layout, true);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("resize", layout);
      window.removeEventListener("scroll", layout, true);
    };
  }, [open]);
  return (
    <div className="menu">
      <button ref={trigger} type="button" className="btn btn-ghost btn-small" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {label}
      </button>
      {open && createPortal(
        <div ref={pop} className="dropdown-pop" role="menu" style={{ top: place.top, left: place.left, width: 180 }}>
          {items.map((item) => (
            <button key={item.label} type="button" className={item.danger ? "danger" : ""} onClick={() => { setOpen(false); item.onClick(); }}>
              {item.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}

export function Select({ value, onChange, options, label, tight }: { value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; label?: string; tight?: boolean }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState({ top: 0, left: 0, width: 0 });
  useEffect(() => {
    if (!open) return;
    const layout = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.max(rect.width, 168);
      const height = Math.min(options.length * 40 + 12, 280);
      const below = rect.bottom + 8 + height <= window.innerHeight - 8;
      let left = rect.left;
      if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - 8 - width);
      setPlace({ top: below ? rect.bottom + 8 : Math.max(8, rect.top - 8 - height), left, width });
    };
    layout();
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (trigger.current?.contains(target) || pop.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", layout);
    window.addEventListener("scroll", layout, true);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", layout);
      window.removeEventListener("scroll", layout, true);
    };
  }, [open, options.length]);
  const current = options.find((item) => item.value === value);
  return (
    <div className={tight ? "dropdown tight" : "dropdown"}>
      <button ref={trigger} type="button" className="dropdown-trigger" aria-label={label} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span>{current?.label || "Select"}</span>
      </button>
      {open && createPortal(
        <div ref={pop} className="dropdown-pop" role="listbox" style={{ top: place.top, left: place.left, width: place.width }}>
          {options.map((item) => (
            <button key={item.value} type="button" role="option" aria-selected={item.value === value} className={item.value === value ? "on" : undefined} onClick={() => { onChange(item.value); setOpen(false); }}>
              {item.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}

export function PhaseBars({ parts }: { parts: { phase: PhaseId; usd: number }[] }) {
  const max = Math.max(...parts.map((part) => part.usd), 1);
  if (!parts.length) return <p className="muted">No priced rows yet.</p>;
  return (
    <div>
      {parts.map((part) => (
        <div key={part.phase} className="bar-row">
          <span>{phaseOf(part.phase).label}</span>
          <div className="track">
            <span style={{ width: `${(part.usd / max) * 100}%`, background: PHASE_COLOR[part.phase] }} />
          </div>
          <b className="num">{formatUsd(part.usd)}</b>
        </div>
      ))}
    </div>
  );
}

export function Donut({ parts }: { parts: { value: number; color: string }[] }) {
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  if (total <= 0) return <div className="donut empty-donut" />;
  let acc = 0;
  const gradient = parts
    .filter((part) => part.value > 0)
    .map((part) => {
      const start = (acc / total) * 360;
      acc += part.value;
      const end = (acc / total) * 360;
      return `${part.color} ${start}deg ${end}deg`;
    })
    .join(", ");
  return <div className="donut" style={{ background: `conic-gradient(${gradient})` }} />;
}

export function ChipSelect({ options, value, onChange, max }: { options: string[]; value: string[]; onChange: (next: string[]) => void; max?: number }) {
  return (
    <div className="chips">
      {options.map((option) => {
        const on = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            className={cx("chip", on && "on")}
            onClick={() => {
              if (on) onChange(value.filter((item) => item !== option));
              else if (!max || value.length < max) onChange([...value, option]);
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export function ViewSwitch({ value, onChange }: { value: "grid" | "table"; onChange: (value: "grid" | "table") => void }) {
  return (
    <div className="view-switch" role="group" aria-label="Layout">
      <button type="button" className={value === "grid" ? "on" : ""} onClick={() => onChange("grid")}><SquaresFour size={16} weight={value === "grid" ? "fill" : "regular"} />Grid</button>
      <button type="button" className={value === "table" ? "on" : ""} onClick={() => onChange("table")}><Table size={16} weight={value === "table" ? "fill" : "regular"} />Table</button>
    </div>
  );
}
