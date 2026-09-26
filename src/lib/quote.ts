import { PHASES } from "./labels";
import type { Currency, LineItem, PhaseId, Project, Settings } from "../types";

export interface QuoteRow {
  line: LineItem;
  gross: number;
  usd: number;
  costUsd: number | null;
  marginUsd: number | null;
}

export interface Quote {
  rows: QuoteRow[];
  subtotalUsd: number;
  discountUsd: number;
  netUsd: number;
  paidUsd: number;
  invoicedUsd: number;
  unbilledUsd: number;
  compedUsd: number;
  balanceUsd: number;
  byPhase: { phase: PhaseId; usd: number }[];
  native: { currency: Currency; amount: number }[];
  weeklyUsd: number;
  marginUsd: number | null;
  mixed: boolean;
}

export function toUsd(amount: number, currency: Currency, settings: Settings) {
  if (currency === "USD") return amount;
  if (currency === "EUR") return amount * settings.eurUsd;
  return amount * settings.ethUsd;
}

export function quoteTotals(lineItems: LineItem[], discountUsd: number, settings: Settings): Quote {
  const rows: QuoteRow[] = lineItems.map((line) => {
    const gross = line.unitPrice * line.qty;
    const usd = toUsd(gross, line.currency, settings);
    const costUsd =
      line.unitCost == null ? null : toUsd(line.unitCost * line.qty, line.costCurrency || line.currency, settings);
    return {
      line,
      gross,
      usd,
      costUsd,
      marginUsd: costUsd == null ? null : usd - costUsd,
    };
  });

  const subtotalUsd = rows.reduce((sum, row) => sum + row.usd, 0);
  const discount = Number.isFinite(discountUsd) ? discountUsd : 0;
  const netUsd = subtotalUsd - discount;
  const sumBilling = (status: LineItem["billing"]) =>
    rows.filter((row) => row.line.billing === status).reduce((sum, row) => sum + row.usd, 0);
  const paidUsd = sumBilling("paid");
  const invoicedUsd = sumBilling("invoiced");
  const unbilledUsd = sumBilling("unbilled");
  const compedUsd = sumBilling("comped");
  const nativeMap = new Map<Currency, number>();
  for (const row of rows) nativeMap.set(row.line.currency, (nativeMap.get(row.line.currency) || 0) + row.gross);
  const native = [...nativeMap.entries()].map(([currency, amount]) => ({ currency, amount }));
  const costed = rows.filter((row) => row.marginUsd != null);
  const weeklyUsd = rows
    .filter((row) => row.line.meta?.cadence === "week")
    .reduce((sum, row) => sum + toUsd(row.line.unitPrice, row.line.currency, settings), 0);

  return {
    rows,
    subtotalUsd,
    discountUsd: discount,
    netUsd,
    paidUsd,
    invoicedUsd,
    unbilledUsd,
    compedUsd,
    balanceUsd: netUsd - paidUsd - compedUsd,
    byPhase: PHASES.map((phase) => ({
      phase: phase.id,
      usd: rows.filter((row) => row.line.phase === phase.id).reduce((sum, row) => sum + row.usd, 0),
    })).filter((row) => row.usd > 0),
    native,
    weeklyUsd,
    marginUsd: costed.length ? costed.reduce((sum, row) => sum + (row.marginUsd || 0), 0) : null,
    mixed: native.length > 1 || (native[0] != null && native[0].currency !== "USD"),
  };
}

export function projectQuote(project: Project, settings: Settings) {
  return quoteTotals(project.lineItems, project.discountUsd, settings);
}
