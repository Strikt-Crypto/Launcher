export type Currency = "USD" | "EUR" | "ETH";

export type PhaseId = "prelaunch" | "phase-1" | "phase-2" | "phase-3" | "startup" | "treasury" | "bundle";

export type ProjectStatus = "draft" | "quoted" | "booked" | "live" | "closed";

export type LaunchKind = "meme" | "utility" | "vamped" | "cto";

export type LineStatus = "planned" | "held" | "live" | "complete" | "blocked";

export type BillingStatus = "unbilled" | "invoiced" | "paid" | "comped";

export type ServiceKind = "service" | "pack" | "retainer" | "treasury";

export type PlatformKind = "launchpad" | "market" | "wallet" | "social";

export type SupplyPct = 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80;

export type SupplyRoute = "v1" | "v2";

export type TreasuryKey =
  | "pons"
  | "supply"
  | "volume"
  | "mkt-pre"
  | "mkt-p1"
  | "mm-budget"
  | "mm-weeks";

export interface Tier {
  id: string;
  label: string;
  price: number;
  currency: Currency;
  duration?: string;
  note?: string;
}

export interface Requirement {
  id: string;
  text: string;
  critical?: boolean;
}

export interface IncludeItem {
  label: string;
  url?: string;
  note?: string;
}

export interface LinkItem {
  label: string;
  url: string;
}

export interface Recurring {
  every: "week" | "day";
  price: number;
  currency: Currency;
  label: string;
}

export interface Service {
  id: string;
  name: string;
  phase: PhaseId;
  kind: ServiceKind;
  summary: string;
  details: string;
  tiers: Tier[];
  requirements: Requirement[];
  includes: IncludeItem[];
  rules: string[];
  providerId: string;
  contactId?: string;
  platformIds: string[];
  links: LinkItem[];
  chains: string[];
  recurring?: Recurring;
  available: boolean;
  countryPick?: { max: number; includesWorldwide: boolean };
  openPrice?: boolean;
  notes?: string;
}

export interface Outlet {
  name: string;
  url?: string;
  note?: string;
  group?: string;
  links?: LinkItem[];
  price?: number;
}

export interface Package {
  id: string;
  name: string;
  rank: number;
  group: "pr" | "bundle" | "budget";
  phase: PhaseId;
  price: number;
  currency: Currency;
  summary: string;
  guarantees: string[];
  outlets: Outlet[];
  extras: string[];
  providerId: string;
  includes: IncludeItem[];
  notes?: string;
}

export interface Provider {
  id: string;
  name: string;
  role: string;
  about: string;
  website: string;
  telegram: string;
  x: string;
  discord: string;
  email: string;
  region: string;
  logo?: string;
}

export interface Platform {
  id: string;
  name: string;
  kind: PlatformKind;
  chains: string[];
  url: string;
  notes: string;
  feeNote: string;
  logo?: string;
}

export interface LineMeta {
  countries?: string[];
  cashtag?: string;
  duration?: string;
  cadence?: "week" | "day";
  treasuryKey?: TreasuryKey;
  supplyPct?: SupplyPct;
  route?: SupplyRoute;
  caller?: string;
}

export interface LineItem {
  id: string;
  source: "service" | "package" | "custom";
  refId?: string;
  name: string;
  phase: PhaseId;
  detail: string;
  providerId?: string;
  qty: number;
  unitPrice: number;
  currency: Currency;
  unitCost?: number;
  costCurrency?: Currency;
  status: LineStatus;
  billing: BillingStatus;
  notes: string;
  meta?: LineMeta;
}

export interface CheckItem {
  id: string;
  group: string;
  text: string;
  done: boolean;
  critical: boolean;
  lineItemId?: string;
  phase?: PhaseId;
}

export interface Wallet {
  id: string;
  label: string;
  address: string;
  chain: string;
  purpose: string;
  group?: "hot" | "supply";
  privateKey?: string;
}

export interface AssetFile {
  id: string;
  name: string;
  data: string;
}

export interface AssetPack {
  id: string;
  name: string;
  link: string;
  files: AssetFile[];
}

export interface SocialAccount {
  id: string;
  name: string;
  url: string;
  handle: string;
  password?: string;
  note: string;
}

export interface ContactLink {
  id: string;
  name: string;
  url: string;
  handle: string;
}

export interface Contact {
  id: string;
  name: string;
  title: string;
  phone: string;
  email: string;
  company: string;
  note: string;
  image: string;
  links: ContactLink[];
  providerId?: string;
}

export interface Treasury {
  launchFeeEth: number;
  launchFeeLabel: string;
  hotWalletsNote: string;
  supplyPct: SupplyPct | null;
  route: SupplyRoute | null;
  marketingPreEur: number;
  marketingPhase1Eur: number;
  volumeBudgetUsd: number;
  volumeTarget: string;
  gasNote: string;
  mmBudgetUsd: number;
  mmWeeklyUsd: number;
  mmWeeks: number;
  notes: string;
}

export interface Project {
  id: string;
  name: string;
  ticker: string;
  logo?: string;
  chain: string;
  launchpadId: string;
  contract: string;
  supply: string;
  status: ProjectStatus;
  launch: LaunchKind;
  utility: string;
  client: string;
  budgetUsd: number;
  discountUsd: number;
  discountNote: string;
  notes: string;
  sample?: boolean;
  lineItems: LineItem[];
  checks: CheckItem[];
  wallets: Wallet[];
  socials: SocialAccount[];
  contactIds: string[];
  logoPacks: AssetPack[];
  bannerPacks: AssetPack[];
  treasury: Treasury;
  createdAt: string;
  updatedAt: string;
  targetDate: string;
}

export interface Settings {
  deskName: string;
  ethUsd: number;
  eurUsd: number;
}

export interface AppState {
  version: 1;
  settings: Settings;
  providers: Provider[];
  platforms: Platform[];
  services: Service[];
  packages: Package[];
  projects: Project[];
  contacts: Contact[];
}
