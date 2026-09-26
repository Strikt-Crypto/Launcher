import { ROUTE_LABEL } from "./labels";
import type { LineItem, SupplyPct, SupplyRoute, Treasury, TreasuryKey } from "../types";

export const SUPPLY_ROWS: { pct: SupplyPct; v1: number; v2: number }[] = [
  { pct: 10, v1: 0.271, v2: 0.335 },
  { pct: 20, v1: 0.406, v2: 0.503 },
  { pct: 30, v1: 0.609, v2: 0.754 },
  { pct: 40, v1: 0.913, v2: 1.131 },
  { pct: 50, v1: 1.369, v2: 1.697 },
  { pct: 60, v1: 2.054, v2: 2.545 },
  { pct: 70, v1: 3.081, v2: 3.818 },
  { pct: 80, v1: 4.622, v2: 5.727 },
];

export const TREASURY_KEYS: TreasuryKey[] = [
  "pons",
  "supply",
  "volume",
  "mkt-pre",
  "mkt-p1",
  "mm-budget",
  "mm-weeks",
];

export function emptyTreasury(): Treasury {
  return {
    launchFeeEth: 0.0005,
    launchFeeLabel: "Pons launch fee",
    hotWalletsNote: "TBD",
    supplyPct: null,
    route: null,
    marketingPreEur: 0,
    marketingPhase1Eur: 0,
    volumeBudgetUsd: 0,
    volumeTarget: "500K / 24H",
    gasNote: "Gas is extra on the volume budget.",
    mmBudgetUsd: 0,
    mmWeeklyUsd: 1000,
    mmWeeks: 0,
    notes: "",
  };
}

function shell(partial: Omit<LineItem, "id" | "status" | "billing" | "notes" | "qty"> & { qty?: number; notes?: string }): Omit<LineItem, "id"> {
  return {
    qty: 1,
    status: "planned",
    billing: "unbilled",
    notes: "",
    ...partial,
  };
}

export function treasuryDraft(treasury: Treasury, key: TreasuryKey): Omit<LineItem, "id"> | null {
  if (key === "pons") {
    if (treasury.launchFeeEth <= 0) return null;
    return shell({
      source: "service",
      refId: "pons-fee",
      name: treasury.launchFeeLabel || "Pons launch fee",
      phase: "startup",
      detail: "Launch fee",
      providerId: "pons-desk",
      unitPrice: treasury.launchFeeEth,
      currency: "ETH",
      meta: { treasuryKey: "pons" },
    });
  }

  if (key === "supply") {
    if (!treasury.supplyPct || !treasury.route) return null;
    const row = SUPPLY_ROWS.find((item) => item.pct === treasury.supplyPct);
    if (!row) return null;
    return shell({
      source: "service",
      refId: treasury.route === "v2" ? "supply-buy-v2" : "supply-buy",
      name: treasury.route === "v2" ? "Buy supply · Curve, then V4" : "Buy supply · Uniswap V3",
      phase: "startup",
      detail: `${treasury.supplyPct}% · ${ROUTE_LABEL[treasury.route]}`,
      providerId: "treasury-desk",
      unitPrice: row[treasury.route],
      currency: "ETH",
      meta: { treasuryKey: "supply", supplyPct: treasury.supplyPct, route: treasury.route },
    });
  }

  if (key === "volume") {
    if (treasury.volumeBudgetUsd <= 0) return null;
    return shell({
      source: "service",
      refId: "volume-500k",
      name: "Volume budget",
      phase: "startup",
      detail: treasury.volumeTarget || "Volume",
      providerId: "treasury-desk",
      unitPrice: treasury.volumeBudgetUsd,
      currency: "USD",
      notes: treasury.gasNote,
      meta: { treasuryKey: "volume" },
    });
  }

  if (key === "mkt-pre") {
    if (treasury.marketingPreEur <= 0) return null;
    return shell({
      source: "service",
      refId: "mkt-pre",
      name: "Marketing pre-launch",
      phase: "prelaunch",
      detail: "Pre-launch",
      providerId: "treasury-desk",
      unitPrice: treasury.marketingPreEur,
      currency: "EUR",
      meta: { treasuryKey: "mkt-pre" },
    });
  }

  if (key === "mkt-p1") {
    if (treasury.marketingPhase1Eur <= 0) return null;
    return shell({
      source: "service",
      refId: "mkt-phase1",
      name: "Marketing phase 1",
      phase: "phase-1",
      detail: "Phase 1",
      providerId: "treasury-desk",
      unitPrice: treasury.marketingPhase1Eur,
      currency: "EUR",
      meta: { treasuryKey: "mkt-p1" },
    });
  }

  if (key === "mm-budget") {
    if (treasury.mmBudgetUsd <= 0) return null;
    return shell({
      source: "service",
      refId: "mm-budget",
      name: "MM budget",
      phase: "startup",
      detail: "Market-making working capital",
      providerId: "treasury-desk",
      unitPrice: treasury.mmBudgetUsd,
      currency: "USD",
      meta: { treasuryKey: "mm-budget" },
    });
  }

  if (treasury.mmWeeks <= 0 || treasury.mmWeeklyUsd <= 0) return null;
  return shell({
    source: "custom",
    refId: "mm-retainer",
    name: "MM retainer",
    phase: "startup",
    detail: `${treasury.mmWeeks} week${treasury.mmWeeks === 1 ? "" : "s"}`,
    providerId: "artem",
    qty: treasury.mmWeeks,
    unitPrice: treasury.mmWeeklyUsd,
    currency: "USD",
    meta: { treasuryKey: "mm-weeks", cadence: "week" },
  });
}

export function supplyEth(pct: SupplyPct, route: SupplyRoute) {
  const row = SUPPLY_ROWS.find((item) => item.pct === pct);
  return row ? row[route] : 0;
}
