"use client";

import { Bank, CaretLeft, CaretRight, ChartBar, ChartLineUp, Clock, Coin, Coins, CurrencyCircleDollar, Flag, Path, Ranking, RocketLaunch } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { earnedIn } from "../lib/earnings";
import { formatCompactUsd, formatPct, formatUsd, tickerOf } from "../lib/format";
import { LAUNCH_KINDS, WORK_LANES } from "../lib/labels";
import { initials } from "../lib/logo";
import { mockMarket } from "../lib/mockMarket";
import { projectQuote } from "../lib/quote";
import { useStore } from "../store";
import type { ProjectStatus } from "../types";

function tickColor(index: number, filled: number) {
  const t = filled <= 1 ? 0 : index / (filled - 1);
  const mix = (a: number[], b: number[], u: number) => a.map((channel, i) => Math.round(channel + (b[i] - channel) * u));
  const rgb = t < 0.55 ? mix([124, 255, 96], [198, 255, 70], t / 0.55) : mix([198, 255, 70], [62, 214, 198], (t - 0.55) / 0.45);
  return `rgb(${rgb.join(",")})`;
}

function Usage({ filled, total, label }: { filled: number; total: number; label: string }) {
  const ticks = 72;
  const on = Math.round((total ? filled / total : 0) * ticks);
  return (
    <div className="usage">
      <p className="usage-copy"><b>{filled} up</b> <span>of {total}</span></p>
      <div className="usage-meter" role="img" aria-label={label}>
        {Array.from({ length: ticks }, (_, index) => (
          <i key={index} className={index < on ? "on" : ""} style={index < on ? { background: tickColor(index, on) } : undefined} />
        ))}
      </div>
    </div>
  );
}

function TickMeter({ value, max, tone, label }: { value: number; max: number; tone: "spend" | "earn"; label: string }) {
  const ticks = 32;
  const on = max > 0 ? Math.round((value / max) * ticks) : 0;
  return (
    <div className={`ticks ${tone}`} role="img" aria-label={label}>
      {Array.from({ length: ticks }, (_, index) => (
        <i key={index} className={index < on ? "on" : ""} />
      ))}
    </div>
  );
}

function Ring({ done, total }: { done: number; total: number }) {
  const p = total ? done / total : 0;
  const c = 2 * Math.PI * 15;
  return (
    <svg className="arc" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="15" />
      <circle cx="20" cy="20" r="15" strokeDasharray={`${(c * p).toFixed(2)} ${c.toFixed(2)}`} />
    </svg>
  );
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function parseDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function nearestDay(dates: Date[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = dates.find((date) => date >= today);
  return upcoming || dates[dates.length - 1] || today;
}

function monthGrid(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function Face({ name, logo, className }: { name: string; logo?: string; className?: string }) {
  return logo ? <img className={className} src={logo} alt="" /> : <span className={className}>{initials(name)}</span>;
}

const BOARD: { id: ProjectStatus; label: string }[] = [
  { id: "draft", label: "Draft" },
  { id: "quoted", label: "Planning" },
  { id: "booked", label: "Ready" },
  { id: "live", label: "Live" },
];

export function Dashboard() {
  const store = useStore();
  const books = store.projects.map((project) => ({
    project,
    quote: projectQuote(project, store.settings),
    market: mockMarket(project.id),
  }));
  const sum = (pick: (row: (typeof books)[number]) => number) => books.reduce((total, row) => total + pick(row), 0);
  const budget = sum((row) => row.project.budgetUsd || 0);
  const up = books.filter((row) => row.market.change24h >= 0).length;
  const down = books.length - up;
  const tape = [...books].sort((a, b) => b.market.change24h - a.market.change24h);
  const spendOf = (rows: typeof books) => rows.reduce((total, row) => total + row.quote.netUsd, 0);
  const checksOf = (rows: typeof books) => {
    const checks = rows.flatMap((row) => row.project.checks);
    return { done: checks.filter((check) => check.done).length, total: checks.length };
  };
  const spendIn = (rows: typeof books, id: string) => rows.reduce((total, row) => total + row.quote.rows.filter((item) => item.line.phase === id).reduce((sum, item) => sum + item.usd, 0), 0);
  const earnedInRows = (rows: typeof books, id: (typeof WORK_LANES)[number]["id"]) => rows.reduce((total, row) => total + earnedIn(row.project, id), 0);
  const closed = books.filter((row) => row.project.status === "closed");
  const closedChecks = checksOf(closed);
  const allChecks = books.flatMap((row) => row.project.checks);
  const criticalOpen = allChecks.filter((check) => check.critical && !check.done).length;
  const wallets = books.flatMap((row) => row.project.wallets);
  const hot = wallets.filter((wallet) => wallet.group !== "supply").length;
  const supply = wallets.length - hot;
  const maxMove = Math.max(...books.map((row) => Math.abs(row.market.change24h)), 1);
  const statuses = [
    ...BOARD.map((item) => {
      const rows = books.filter((row) => row.project.status === item.id);
      const checks = checksOf(rows);
      return { id: item.id, label: item.label, count: rows.length, spend: spendOf(rows), done: checks.done, total: checks.total };
    }),
    { id: "closed", label: "Closed", count: closed.length, spend: spendOf(closed), done: closedChecks.done, total: closedChecks.total },
  ];
  const shareOf = (part: number, total: number) => `${total ? Math.round((part / total) * 100) : 0}%`;
  const kinds = LAUNCH_KINDS.map((kind) => {
    const rows = books.filter((row) => row.project.launch === kind.id);
    return { id: kind.id, label: kind.label, count: rows.length, spend: spendOf(rows), share: books.length ? (rows.length / books.length) * 100 : 0 };
  });
  const paid = sum((row) => row.quote.paidUsd);
  const open = sum((row) => row.quote.unbilledUsd);
  const committed = sum((row) => row.quote.invoicedUsd);
  const covered = sum((row) => row.quote.compedUsd);
  const dated = books
    .map((row) => ({ ...row, date: parseDay(row.project.targetDate) }))
    .filter((row): row is (typeof books)[number] & { date: Date } => Boolean(row.date))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const opening = nearestDay(dated.map((row) => row.date));
  const [cursor, setCursor] = useState(() => new Date(opening.getFullYear(), opening.getMonth(), 1));
  const [selected, setSelected] = useState(() => dayKey(opening));
  const [phaseAt, setPhaseAt] = useState(0);
  const phaseCount = books.length + 1;
  const phaseIndex = ((phaseAt % phaseCount) + phaseCount) % phaseCount;
  const phaseBook = phaseIndex === 0 ? null : books[phaseIndex - 1];
  const phaseRows = phaseBook ? [phaseBook] : books;
  const phases = WORK_LANES.map((lane) => ({ ...lane, spend: spendIn(phaseRows, lane.id), earned: earnedInRows(phaseRows, lane.id) }));
  const phaseSpendAll = phases.reduce((total, lane) => total + lane.spend, 0);
  const phaseEarnedAll = phases.reduce((total, lane) => total + lane.earned, 0);
  const shiftPhase = (delta: number) => setPhaseAt((index) => (index + delta + phaseCount) % phaseCount);
  const monthSpend = dated
    .filter((row) => row.date.getFullYear() === cursor.getFullYear() && row.date.getMonth() === cursor.getMonth())
    .reduce((total, row) => total + row.quote.netUsd, 0);
  const dayRows = dated.filter((row) => dayKey(row.date) === selected);
  const daySpend = dayRows.reduce((total, row) => total + row.quote.netUsd, 0);
  const monthName = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const cells = monthGrid(cursor);
  const byDay = new Map<string, typeof dated>();
  dated.forEach((row) => {
    const key = dayKey(row.date);
    const list = byDay.get(key) || [];
    list.push(row);
    byDay.set(key, list);
  });
  const choose = (date: Date) => {
    setCursor(new Date(date.getFullYear(), date.getMonth(), 1));
    setSelected(dayKey(date));
  };
  const shiftMonth = (delta: number) => {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1);
    const current = parseDay(selected) || next;
    const last = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    choose(new Date(next.getFullYear(), next.getMonth(), Math.min(current.getDate(), last)));
  };

  return (
    <div className="page screen">
      <div className="desk-fit">
        <div className="dash">
          <section className="card dash-hero">
            <div className="hero-main">
              <span className="tiny with-icon"><ChartLineUp size={14} />Volume 24h</span>
              <strong className="hero-figure">{formatCompactUsd(sum((row) => row.market.volume24h))}</strong>
              <Usage filled={up} total={up + down} label={`${up} up of ${up + down}`} />
              <div className="glass-facts">
                <div><span className="tiny with-icon"><ChartBar size={14} />Total volume</span><b>{formatCompactUsd(sum((row) => row.market.volumeAll))}</b></div>
                <div><span className="tiny with-icon"><Bank size={14} />Market cap</span><b>{formatCompactUsd(sum((row) => row.market.marketCap))}</b></div>
                <div><span className="tiny with-icon"><Coin size={14} />Tokens</span><b>{store.projects.length}</b></div>
              </div>
            </div>
            <div className="hero-moves">
              <span className="tiny with-icon"><Ranking size={14} />Top tokens</span>
              {tape.slice(0, 5).map(({ project, market }) => (
                <Link key={project.id} href={`/projects/${project.id}`} className="move-row">
                  <span className="token-logo sm">{project.logo ? <img src={project.logo} alt="" /> : initials(project.name)}</span>
                  <span className="tape-id">
                    <span>{project.name}</span>
                    <i className={market.change24h >= 0 ? "hi" : "lo"} style={{ width: `${Math.min(100, (Math.abs(market.change24h) / maxMove) * 100)}%` }} />
                  </span>
                  <b className={market.change24h >= 0 ? "num hi" : "num lo"}>{formatPct(market.change24h)}</b>
                </Link>
              ))}
            </div>
          </section>
          <section className="card dash-status">
            <h2><Flag size={16} />Status</h2>
            <div className="desk-rows">
              {statuses.map((row) => (
                <div key={row.id}>
                  <span>{row.label}</span>
                  <b>{row.count}</b>
                  <div className="meter" aria-hidden="true"><i style={{ width: `${row.total ? (row.done / row.total) * 100 : 0}%` }} /></div>
                  <Ring done={row.done} total={row.total} />
                  <span className="row-money">{formatUsd(row.spend)}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="card dash-phases">
            <div className="spread">
              <div className="phase-switch">
                <h2><Path size={16} />Phases</h2>
                <div className="phase-pager">
                  <button type="button" aria-label="Previous token" onClick={() => shiftPhase(-1)} disabled={books.length === 0}><CaretLeft size={16} /></button>
                  <span className="phase-who">
                    {phaseBook && <span className="token-logo sm">{phaseBook.project.logo ? <img src={phaseBook.project.logo} alt="" /> : initials(phaseBook.project.name)}</span>}
                    <strong>{phaseBook ? phaseBook.project.name : "All"}</strong>
                  </span>
                  <button type="button" aria-label="Next token" onClick={() => shiftPhase(1)} disabled={books.length === 0}><CaretRight size={16} /></button>
                </div>
              </div>
              <div className="phase-totals">
                <span><i className="spend" />Spend <b>{formatUsd(phaseSpendAll)}</b></span>
                <span><i className="earn" />Earned <b>{formatUsd(phaseEarnedAll)}</b></span>
              </div>
            </div>
            <div className="phase-board">
              {phases.map((lane) => (
                <div key={lane.id} className="phase-tile">
                  <strong>{lane.label}</strong>
                  <div className="phase-metric">
                    <div className="phase-metric-top">
                      <span className="tiny">Spend</span>
                      <span className="tiny">{shareOf(lane.spend, phaseSpendAll)}</span>
                    </div>
                    <b>{formatUsd(lane.spend)}</b>
                    <TickMeter value={lane.spend} max={phaseSpendAll} tone="spend" label={`Spend ${shareOf(lane.spend, phaseSpendAll)}`} />
                  </div>
                  <div className="phase-metric">
                    <div className="phase-metric-top">
                      <span className="tiny">Earned</span>
                      <span className="tiny">{shareOf(lane.earned, phaseEarnedAll)}</span>
                    </div>
                    <b className={lane.earned > 0 ? "sage" : ""}>{formatUsd(lane.earned)}</b>
                    <TickMeter value={lane.earned} max={phaseEarnedAll} tone="earn" label={`Earned ${shareOf(lane.earned, phaseEarnedAll)}`} />
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="card dash-kinds">
            <h2><RocketLaunch size={16} />Launch</h2>
            <div className="desk-rows">
              {kinds.map((kind) => (
                <div key={kind.id}>
                  <span>{kind.label}</span>
                  <b>{kind.count}</b>
                  <div className="meter" aria-hidden="true"><i style={{ width: `${kind.share}%` }} /></div>
                  <span className="row-money">{formatUsd(kind.spend)}</span>
                </div>
              ))}
            </div>
            <div className="kind-foot">
              <div><span className="tiny">Hot wallets</span><b>{hot}</b></div>
              <div><span className="tiny">Supply</span><b>{supply}</b></div>
              <div><span className="tiny">Checklist</span><b>{allChecks.filter((check) => check.done).length}/{allChecks.length}</b></div>
              <div><span className="tiny">Critical open</span><b>{criticalOpen}</b></div>
            </div>
          </section>
          <section className="card dash-panel">
            <div className="spread">
              <h2><CurrencyCircleDollar size={16} />Money</h2>
              <div className="stack-key"><span>Paid</span><span>Open</span><span>Committed</span><span>Covered</span></div>
            </div>
            <div className="stack-bar" aria-hidden="true">
              <i style={{ flexGrow: paid || 0.001 }} />
              <i style={{ flexGrow: open || 0.001 }} />
              <i style={{ flexGrow: committed || 0.001 }} />
              <i style={{ flexGrow: covered || 0.001 }} />
            </div>
            <div className="money-totals">
              <div className="money-lead">
                <div><span className="tiny">Spend</span><strong>{formatUsd(sum((row) => row.quote.netUsd))}</strong></div>
                <div><span className="tiny">Paid</span><strong>{formatUsd(paid)}</strong></div>
                <div><span className="tiny">Remaining</span><strong>{formatUsd(sum((row) => row.quote.balanceUsd))}</strong></div>
              </div>
              <div className="money-grid">
                <div><span className="tiny">Budget</span><strong>{budget ? formatUsd(budget) : "Not set"}</strong></div>
                <div><span className="tiny">Subtotal</span><strong>{formatUsd(sum((row) => row.quote.subtotalUsd))}</strong></div>
                <div><span className="tiny">Discount</span><strong>−{formatUsd(sum((row) => row.quote.discountUsd))}</strong></div>
                <div><span className="tiny">Open</span><strong>{formatUsd(sum((row) => row.quote.unbilledUsd))}</strong></div>
                <div><span className="tiny">Committed</span><strong>{formatUsd(sum((row) => row.quote.invoicedUsd))}</strong></div>
                <div><span className="tiny">Covered</span><strong>{formatUsd(sum((row) => row.quote.compedUsd))}</strong></div>
              </div>
            </div>
          </section>
          <section className="card dash-panel dash-move">
            <div className="spread">
              <h2><Clock size={16} />24h</h2>
              <span className="tiny">{up} up · {down} down</span>
            </div>
            <div className="line-fill">
              {tape.map(({ project, market }) => (
                <Link key={project.id} href={`/projects/${project.id}`} className="list-row tape">
                  <span className="token-logo sm">{project.logo ? <img src={project.logo} alt="" /> : initials(project.name)}</span>
                  <span className="tape-id">
                    <span>{project.name}</span>
                    <i className={market.change24h >= 0 ? "hi" : "lo"} style={{ width: `${Math.min(100, (Math.abs(market.change24h) / maxMove) * 100)}%` }} />
                  </span>
                  <span className="tape-stat">
                    <span className="tiny">Volume</span>
                    <b>{formatCompactUsd(market.volume24h)}</b>
                  </span>
                  <span className="tape-stat">
                    <span className="tiny">Market cap</span>
                    <b>{formatCompactUsd(market.marketCap)}</b>
                  </span>
                  <span className="tiny">{tickerOf(project.ticker)}</span>
                  <b className={market.change24h >= 0 ? "num hi" : "num lo"}>{formatPct(market.change24h)}</b>
                </Link>
              ))}
            </div>
          </section>
          <section className="card dash-cal">
            <div className="cal-head">
              <div className="cal-nav">
                <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)}><CaretLeft size={16} /></button>
                <strong>{monthName}</strong>
                <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)}><CaretRight size={16} /></button>
              </div>
              <div className="cal-spent">
                <span className="tiny with-icon"><Coins size={14} />Money spent</span>
                <b>{formatUsd(monthSpend)}</b>
              </div>
            </div>
            <div className="cal-grid">
              {WEEKDAYS.map((day) => <span key={day} className="cal-dow">{day}</span>)}
              {cells.map((date) => {
                const key = dayKey(date);
                const marks = byDay.get(key) || [];
                const outside = date.getMonth() !== cursor.getMonth();
                const shown = marks.slice(0, 2);
                return (
                  <button key={key} type="button" className={outside ? "cal-day out" : selected === key ? "cal-day on" : "cal-day"} onClick={() => choose(date)}>
                    {shown.length > 0 && (
                      <span className="cal-marks">
                        {shown.map((row) => <Face key={row.project.id} name={row.project.name} logo={row.project.logo} />)}
                        {marks.length > shown.length && <span className="more">+{marks.length - shown.length}</span>}
                      </span>
                    )}
                    <span className="cal-num">{date.getDate()}</span>
                  </button>
                );
              })}
            </div>
            <div className="cal-sheet">
              <div className="cal-list">
                {dayRows.length === 0 && <p className="line-empty">Nothing that day.</p>}
                {dayRows.map((row) => (
                  <Link key={row.project.id} href={`/projects/${row.project.id}`} className="cal-row">
                    <Face className="cal-face" name={row.project.name} logo={row.project.logo} />
                    <span>
                      <strong>{row.project.name}</strong>
                      <span className="tiny">Target {row.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                    </span>
                    <b>{formatUsd(row.quote.netUsd)}</b>
                  </Link>
                ))}
              </div>
              <div className="cal-foot">
                <span>Total: <b>{formatUsd(daySpend)}</b></span>
                {dayRows[0] && <Link className="btn btn-primary" href={`/projects/${dayRows[0].project.id}`}>Open</Link>}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
