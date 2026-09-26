import type { Project, Wallet } from "../types";
import { supplyEth } from "./treasury";

export type WalletHolding = {
  tokens: number | null;
  share: number | null;
  tokenUsd: number | null;
  eth: number | null;
  ethUsd: number | null;
};

function seed(id: string) {
  let n = 2166136261;
  for (let i = 0; i < id.length; i++) n = Math.imul(n ^ id.charCodeAt(i), 16777619);
  return n >>> 0;
}

function parseSupply(supply: string) {
  const n = Number(supply.replace(/,/g, "").trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function walletHolding(wallet: Wallet, project: Project, marketCap: number, ethUsd: number, supplyCount: number): WalletHolding {
  const unit = (seed(wallet.id) % 1000) / 1000;
  const supply = parseSupply(project.supply);
  const posted = wallet.group === "supply" ? project.treasury.supplyPct : null;
  const route = project.treasury.route;
  let share: number | null;
  let eth: number | null;

  if (wallet.group === "supply") {
    if (posted && route) {
      const count = Math.max(1, supplyCount);
      share = posted / count;
      eth = supplyEth(posted, route) / count;
    } else {
      share = null;
      eth = null;
    }
  } else if (wallet.purpose === "Deployer") {
    share = 0.12 + unit * 0.55;
    eth = 2.4 + unit * 6;
  } else if (wallet.purpose === "Buyback") {
    share = 1.8 + unit * 3.4;
    eth = 6 + unit * 14;
  } else if (wallet.purpose === "Market making") {
    share = 0.6 + unit * 1.8;
    eth = 10 + unit * 20;
  } else if (wallet.purpose === "Treasury") {
    share = 0.4 + unit * 1.2;
    eth = 8 + unit * 16;
  } else {
    share = 0.7 + unit * 2.1;
    eth = 5 + unit * 18;
  }

  const tokens = share != null && supply > 0 ? supply * (share / 100) : null;
  const tokenUsd = share != null && supply > 0 ? marketCap * (share / 100) : null;
  return { tokens, share, tokenUsd, eth, ethUsd: eth != null ? eth * ethUsd : null };
}

export function formatTokens(amount: number) {
  const abs = Math.abs(amount);
  const units: [number, string][] = [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
  for (const [size, suffix] of units) {
    if (abs >= size) {
      const value = abs / size;
      const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2;
      return `${value.toFixed(digits)}${suffix}`;
    }
  }
  return amount.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function formatShare(pct: number) {
  return `${pct.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}%`;
}
