import type {
  BillingStatus,
  Currency,
  LineStatus,
  PhaseId,
  PlatformKind,
  ProjectStatus,
  LaunchKind,
  ServiceKind,
  SupplyRoute,
} from "../types";

export const WORK_LANES: { id: PhaseId; n: string; label: string; hint: string }[] = [
  { id: "startup", n: "00", label: "Startup", hint: "Hot wallets, launch fee, supply, volume, and market making" },
  { id: "prelaunch", n: "01", label: "Pre-launch", hint: "Marketing before the token is live" },
  { id: "phase-1", n: "02", label: "Phase 1", hint: "Trending, listings, wallet placement, and the phase 1 budget" },
  { id: "phase-2", n: "03", label: "Phase 2", hint: "X trending, worldwide and by country" },
  { id: "phase-3", n: "04", label: "Phase 3", hint: "Press ladder" },
];

export const PHASES: { id: PhaseId; n: string; label: string; hint: string }[] = [
  ...WORK_LANES,
  { id: "bundle", n: "05", label: "Bundles", hint: "Packs that cross more than one seller" },
];

const PHASE_INDEX: { id: PhaseId; n: string; label: string; hint: string }[] = [
  ...PHASES,
  { id: "treasury", n: "00", label: "Startup", hint: "Moved into Startup" },
];

export const PHASE_COLOR: Record<PhaseId, string> = {
  prelaunch: "#f5f5f5",
  "phase-1": "#d6d6d6",
  "phase-2": "#a3a3a3",
  "phase-3": "#ff6b57",
  startup: "#3dbe86",
  treasury: "#3dbe86",
  bundle: "#737373",
};

export const LAUNCH_KINDS: { id: LaunchKind; label: string; group: string; note: string; placeholder: string; empty: string }[] = [
  { id: "meme", label: "Meme", group: "Meme tokens", note: "", placeholder: "", empty: "Meme" },
  { id: "utility", label: "Utility", group: "Utility tokens", note: "Utility attached", placeholder: "Staking, payments, escrow", empty: "Utility not set" },
  { id: "vamped", label: "Vamped", group: "Vamped tokens", note: "Vamped from", placeholder: "The name this revives", empty: "Source not set" },
  { id: "cto", label: "CTO", group: "Community takeovers", note: "Takeover of", placeholder: "The token being taken over", empty: "Token not set" },
];

export function launchKindOf(id?: string) {
  return LAUNCH_KINDS.find((item) => item.id === id) || LAUNCH_KINDS[0];
}

export const CHAINS = ["Robinhood", "Solana", "Ethereum", "Base", "BNB Chain", "Arbitrum", "Polygon", "Avalanche"];

export const COUNTRIES = [
  "United States",
  "India",
  "Japan",
  "Russia",
  "Germany",
  "Indonesia",
  "Brazil",
  "France",
  "United Kingdom",
  "Turkey",
  "Italy",
  "Mexico",
  "South Korea",
  "Canada",
  "Spain",
  "Saudi Arabia",
  "Egypt",
  "Australia",
  "Poland",
  "Iran",
  "Pakistan",
  "Vietnam",
  "Nigeria",
  "Bangladesh",
  "Netherlands",
  "Argentina",
  "Philippines",
  "Malaysia",
  "Colombia",
  "United Arab Emirates",
  "Romania",
  "Belgium",
  "Switzerland",
  "Singapore",
  "Sweden",
  "Norway",
  "Austria",
  "Kazakhstan",
  "Algeria",
  "Chile",
  "Czechia (Czech Republic)",
  "Peru",
  "Iraq",
  "Israel",
  "Ukraine",
  "Denmark",
  "Portugal",
  "Hungary",
  "Greece",
  "Finland",
  "New Zealand",
  "Bulgaria",
  "Belarus",
  "Slovakia",
  "Serbia",
  "Lithuania",
  "Luxembourg",
  "Estonia",
];

export const ROUTE_LABEL: Record<SupplyRoute, string> = {
  v1: "V1 · Uniswap V3",
  v2: "V2 · Curve, then V4",
};

export const PROJECT_STATUSES: { id: ProjectStatus; label: string }[] = [
  { id: "draft", label: "Draft" },
  { id: "quoted", label: "Planning" },
  { id: "booked", label: "Ready" },
  { id: "live", label: "Live" },
  { id: "closed", label: "Closed" },
];

export const LINE_STATUSES: { id: LineStatus; label: string }[] = [
  { id: "planned", label: "Planned" },
  { id: "held", label: "Held" },
  { id: "live", label: "Live" },
  { id: "complete", label: "Complete" },
  { id: "blocked", label: "Blocked" },
];

export const BILLING: { id: BillingStatus; label: string }[] = [
  { id: "unbilled", label: "Open" },
  { id: "invoiced", label: "Committed" },
  { id: "paid", label: "Paid" },
  { id: "comped", label: "Covered" },
];

export const PLATFORM_KINDS: { id: PlatformKind; label: string; short: string }[] = [
  { id: "launchpad", label: "Launchpads", short: "Pads" },
  { id: "market", label: "Markets & terminals", short: "Markets" },
  { id: "wallet", label: "Wallets", short: "Wallets" },
  { id: "social", label: "Social", short: "Social" },
];

export const SERVICE_KINDS: { id: ServiceKind; label: string }[] = [
  { id: "service", label: "Service" },
  { id: "pack", label: "Pack" },
  { id: "retainer", label: "Retainer" },
  { id: "treasury", label: "Treasury" },
];

export const CURRENCIES: Currency[] = ["USD", "EUR", "ETH"];

export const WALLET_PURPOSES = ["Execution", "Deployer", "Buyback", "Market making", "Treasury", "Community"];

export const SOCIAL_NAMES = ["X", "Telegram", "Discord", "Website", "Instagram", "TikTok", "YouTube", "Email"];

export function phaseOf(id: PhaseId) {
  return PHASE_INDEX.find((phase) => phase.id === id) ?? PHASES[0];
}

export function projectTone(status: ProjectStatus) {
  if (status === "live" || status === "booked") return "sage";
  if (status === "quoted") return "gold";
  if (status === "closed") return "clay";
  return "";
}

export function lineTone(status: LineStatus) {
  if (status === "live" || status === "complete") return "sage";
  if (status === "held") return "gold";
  if (status === "blocked") return "clay";
  return "";
}

export function billingTone(status: BillingStatus) {
  if (status === "paid") return "sage";
  if (status === "invoiced") return "gold";
  if (status === "comped") return "clay";
  return "";
}
