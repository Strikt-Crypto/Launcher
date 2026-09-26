"use client";

import Link from "next/link";
import { checksInPhase } from "../lib/checks";
import { formatCompactUsd, formatPct, formatUsd, tickerOf } from "../lib/format";
import { LAUNCH_KINDS, WORK_LANES } from "../lib/labels";
import { initials } from "../lib/logo";
import { mockMarket } from "../lib/mockMarket";
import { projectQuote } from "../lib/quote";
import { useStore } from "../store";
import type { ProjectStatus } from "../types";

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
  const phaseSpend = (id: string) => books.reduce((total, row) => total + row.quote.rows.filter((item) => item.line.phase === id).reduce((sum, item) => sum + item.usd, 0), 0);
  const closed = books.filter((row) => row.project.status === "closed");
  const closedChecks = checksOf(closed);
  const allChecks = books.flatMap((row) => row.project.checks);
  const criticalOpen = allChecks.filter((check) => check.critical && !check.done).length;
  const wallets = books.flatMap((row) => row.project.wallets);
  const hot = wallets.filter((wallet) => wallet.group !== "supply").length;
  const supply = wallets.length - hot;

  return (
    <div className="page screen">
      <div className="desk-fit">
        <div className="dash">
          <div className="dash-stats">
            {BOARD.map((item) => {
              const rows = books.filter((row) => row.project.status === item.id);
              const checks = checksOf(rows);
              return (
                <article key={item.id} className="dash-stat status">
                  <span className="tiny">{item.label}</span>
                  <strong>{rows.length}</strong>
                  <div className="dash-strip">
                    <span><span className="tiny">Spend</span><b>{formatUsd(spendOf(rows))}</b></span>
                    <span><span className="tiny">Checklist</span><b>{checks.done}/{checks.total}</b></span>
                  </div>
                </article>
              );
            })}
            <article className="dash-stat volume">
              <span className="tiny">Volume 24h</span>
              <strong>{formatCompactUsd(sum((row) => row.market.volume24h))}</strong>
              <div className="dash-splitbar">
                <span><span className="tiny">Up</span><b className="sage">{up}</b></span>
                <span><span className="tiny">Down</span><b className="clay">{down}</b></span>
              </div>
            </article>
            <article className="dash-stat book">
              <span className="tiny">Total volume</span>
              <strong>{formatCompactUsd(sum((row) => row.market.volumeAll))}</strong>
              <div className="dash-lines">
                <span><span className="tiny">Market cap</span><b>{formatCompactUsd(sum((row) => row.market.marketCap))}</b></span>
                <span><span className="tiny">Tokens</span><b>{store.projects.length}</b></span>
              </div>
            </article>
          </div>
          <div className="dash-stats">
            {WORK_LANES.map((lane) => {
              const checks = books.flatMap((row) => checksInPhase(row.project, lane.id));
              const done = checks.filter((check) => check.done).length;
              const projects = books.filter((row) => checksInPhase(row.project, lane.id).length > 0 || row.quote.rows.some((item) => item.line.phase === lane.id)).length;
              return (
                <article key={lane.id} className="dash-stat phase">
                  <div className="spread"><span className="tiny">{lane.label}</span><span className="tiny">{projects} projects</span></div>
                  <strong>{formatUsd(phaseSpend(lane.id))}</strong>
                  <div className="dash-line"><span className="tiny">Checklist</span><b>{done}/{checks.length}</b></div>
                </article>
              );
            })}
            <article className="dash-stat status">
              <span className="tiny">Closed</span>
              <strong>{closed.length}</strong>
              <div className="dash-strip">
                <span><span className="tiny">Spend</span><b>{formatUsd(spendOf(closed))}</b></span>
                <span><span className="tiny">Checklist</span><b>{closedChecks.done}/{closedChecks.total}</b></span>
              </div>
            </article>
          </div>
          <div className="dash-stats">
            {LAUNCH_KINDS.map((kind) => {
              const rows = books.filter((row) => row.project.launch === kind.id);
              const checks = checksOf(rows);
              return (
                <article key={kind.id} className="dash-stat kind">
                  <div className="spread">
                    <span>{kind.label}</span>
                    <strong>{rows.length}</strong>
                  </div>
                  <div className="kind-body">
                    <div><span className="tiny">Spend</span><b>{formatUsd(spendOf(rows))}</b></div>
                    <div><span className="tiny">Checklist</span><b>{checks.done}/{checks.total}</b></div>
                  </div>
                </article>
              );
            })}
            <article className="dash-stat wallets">
              <span className="tiny">Wallets</span>
              <div className="dash-pair">
                <div><span className="tiny">Hot</span><strong>{hot}</strong></div>
                <div><span className="tiny">Supply</span><strong>{supply}</strong></div>
              </div>
            </article>
            <article className="dash-stat checks">
              <span className="tiny">Checklist</span>
              <strong>{allChecks.filter((check) => check.done).length}/{allChecks.length}</strong>
              <div className="dash-lines">
                <span><span className="tiny">Critical open</span><b className={criticalOpen ? "clay" : undefined}>{criticalOpen}</b></span>
                <span><span className="tiny">Socials</span><b>{books.reduce((total, row) => total + row.project.socials.length, 0)}</b></span>
              </div>
            </article>
          </div>
          <div className="dash-split">
          <section className="card dash-panel">
            <h2>Money</h2>
            <div className="money-totals">
              <div className="money-lead">
                <div><span className="tiny">Spend</span><strong>{formatUsd(sum((row) => row.quote.netUsd))}</strong></div>
                <div><span className="tiny">Paid</span><strong className="sage">{formatUsd(sum((row) => row.quote.paidUsd))}</strong></div>
                <div><span className="tiny">Remaining</span><strong>{formatUsd(sum((row) => row.quote.balanceUsd))}</strong></div>
              </div>
              <div className="money-grid">
                <div><span className="tiny">Budget</span><strong>{budget ? formatUsd(budget) : "Not set"}</strong></div>
                <div><span className="tiny">Subtotal</span><strong>{formatUsd(sum((row) => row.quote.subtotalUsd))}</strong></div>
                <div><span className="tiny">Discount</span><strong className="clay">−{formatUsd(sum((row) => row.quote.discountUsd))}</strong></div>
                <div><span className="tiny">Open</span><strong>{formatUsd(sum((row) => row.quote.unbilledUsd))}</strong></div>
                <div><span className="tiny">Committed</span><strong>{formatUsd(sum((row) => row.quote.invoicedUsd))}</strong></div>
                <div><span className="tiny">Covered</span><strong>{formatUsd(sum((row) => row.quote.compedUsd))}</strong></div>
              </div>
            </div>
          </section>
          <section className="card dash-panel dash-move">
            <div className="spread">
              <h2>24h</h2>
              <span className="tiny">{up} up · {down} down</span>
            </div>
            <div className="line-fill">
              {tape.map(({ project, market }) => (
                <Link key={project.id} href={`/projects/${project.id}`} className="list-row quad">
                  <span className="token-logo sm">{project.logo ? <img src={project.logo} alt="" /> : initials(project.name)}</span>
                  <span>{project.name}</span>
                  <span className="tiny">{tickerOf(project.ticker)}</span>
                  <b className={market.change24h >= 0 ? "num sage" : "num clay"}>{formatPct(market.change24h)}</b>
                </Link>
              ))}
            </div>
          </section>
          </div>
        </div>
      </div>
    </div>
  );
}
