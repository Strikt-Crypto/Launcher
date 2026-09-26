import { baselineChecks, makeChecks } from "../lib/checks";
import { mockWallets } from "../lib/mockWallets";
import { emptyTreasury } from "../lib/treasury";
import type { LaunchKind, LineItem, PhaseId, Project, ProjectStatus } from "../types";
import { packages } from "./packages";
import { phaseOneShortlist } from "./shortlist";
import { services } from "./services";

type Row = {
  refId: string;
  name: string;
  phase: PhaseId;
  detail: string;
  providerId: string;
  unitPrice: number;
  currency?: LineItem["currency"];
};

const ROWS = {
  fomo12: { refId: "fomo-trending", name: "FOMO Trending 1–10", phase: "phase-1", detail: "12 hours", providerId: "fomo-desk", unitPrice: 1500 },
  fomo24: { refId: "fomo-trending", name: "FOMO Trending 1–10", phase: "phase-1", detail: "24 hours", providerId: "fomo-desk", unitPrice: 2500 },
  pack: { refId: "listing-pack-1", name: "Launch listing pack 1", phase: "phase-1", detail: "Pack", providerId: "listing-desk", unitPrice: 2750 },
  gmgnDay: { refId: "gmgn-trending", name: "GMGN Trending", phase: "phase-1", detail: "1 day", providerId: "gmgn-desk", unitPrice: 550 },
  gmgnWeek: { refId: "gmgn-trending", name: "GMGN Trending", phase: "phase-1", detail: "1 week", providerId: "gmgn-desk", unitPrice: 2000 },
  rhList: { refId: "rh-listing", name: "Robinhood Wallet Listing", phase: "phase-1", detail: "Listing", providerId: "robinhood-desk", unitPrice: 1000 },
  rhTrend: { refId: "rh-trending", name: "Robinhood Wallet Trending", phase: "phase-1", detail: "24 hours", providerId: "robinhood-desk", unitPrice: 1200 },
  x1: { refId: "x-trending", name: "X Trending — Worldwide", phase: "phase-2", detail: "1 hour", providerId: "x-desk", unitPrice: 700 },
  x4: { refId: "x-trending", name: "X Trending — Worldwide", phase: "phase-2", detail: "4 hours", providerId: "x-desk", unitPrice: 2400 },
  pre: { refId: "mkt-pre", name: "Marketing pre-launch", phase: "prelaunch", detail: "Pre-launch", providerId: "treasury-desk", unitPrice: 2500, currency: "EUR" as const },
  volume: { refId: "volume-500k", name: "Volume budget", phase: "startup", detail: "500K / 24H", providerId: "treasury-desk", unitPrice: 5000 },
  pons: { refId: "pons-fee", name: "Pons launch fee", phase: "startup", detail: "Launch fee", providerId: "pons-desk", unitPrice: 0.0005, currency: "ETH" as const },
} satisfies Record<string, Row>;

function lines(id: string, rows: Row[]): LineItem[] {
  return rows.map((row, index) => ({
    id: `${id}-line-${index + 1}`,
    source: "service",
    refId: row.refId,
    name: row.name,
    phase: row.phase,
    detail: row.detail,
    providerId: row.providerId,
    qty: 1,
    unitPrice: row.unitPrice,
    currency: row.currency || "USD",
    status: "planned",
    billing: "unbilled",
    notes: "",
  }));
}

type Face = {
  name: string;
  ticker: string;
  logo: string;
  notes: string;
  launch?: LaunchKind;
  utility?: string;
  links: { name: string; url: string }[];
};

const CHAIN_FACTS: Record<number, { contract: string; supply: string }> = {
  1: { contract: "0x6982508145454Ce325dDbE47a25d4ec3d2311933", supply: "420,690,000,000,000" },
  2: { contract: "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump", supply: "999,917,860" },
  3: { contract: "0x57e114B691Db790C35207b2e685D4A43181e6061", supply: "15,000,000,000" },
  4: { contract: "0x532f27101965dd16442E59d40670FaF5eBB142E4", supply: "9,999,997,544" },
  5: { contract: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", supply: "998,837,698" },
  6: { contract: "0x514910771AF9Ca656af840dff83E8264EcF986CA", supply: "1,000,000,000" },
  7: { contract: "0xcf0C122c6b73ff809C693DB761e7BaeBe62b6a2E", supply: "10,000,000,000,000" },
  8: { contract: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", supply: "87,994,384,069,685" },
  9: { contract: "0xaaeE1A9723aaDB7afA2810263653A34bA2C21C7a", supply: "390,570,159,911,439" },
  10: { contract: "0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4", supply: "420,689,980,957" },
  11: { contract: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr", supply: "979,932,597" },
  12: { contract: "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b", supply: "497,021,898" },
  13: { contract: "0xc748673057861a797275CD8A068AbB95A902e8de", supply: "420,000,000,000,000,000" },
  14: { contract: "0xE0f63A424a4439cBE457D80E4f4b51aD25b2c56C", supply: "1,000,000,000" },
  15: { contract: "2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv", supply: "76,722,804,262" },
  16: { contract: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed", supply: "36,965,730,333" },
  17: { contract: "0xA35923162C49cF95e6BF26623385eb431ad920D3", supply: "69,000,000,000" },
  18: { contract: "MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5", supply: "88,885,477,443" },
  19: { contract: "0x0DF0587216a4a1bB7d5082fdc491d93d2dD4B413", supply: "219,776,051,832,671" },
  20: { contract: "0x4F9Fd6Be4a90f2620860d680c0d4d5Fb53d1A825", supply: "998,914,867" },
};

const FACE: Record<number, Face> = {
  1: { name: "Pepe", ticker: "PEPE", logo: "https://cdn.dexscreener.com/cms/images/ae001139fa1fcd24f8421d82caf72d8e06fabafab33b089c5d2e6d18039354e7?width=800&height=800&quality=95&format=auto", notes: "Frog meme. This card stays the Phase 1 working sheet, with the discount on the seeded rows.", links: [{ name: "Website", url: "https://www.pepe.vip/" }, { name: "X", url: "https://twitter.com/pepecoineth" }] },
  2: { name: "Fartcoin", ticker: "FARTCOIN", logo: "https://cdn.dexscreener.com/cms/images/9af5672845c89585e9ff1e3b26a640090324aa4d92222052d1043e60ef8182de?width=800&height=800&quality=95&format=auto", notes: "Terminal-of-truths meme that stayed on the Solana trending boards.", links: [{ name: "X", url: "https://x.com/FartCoinOfSOL" }] },
  3: { name: "Ethena", ticker: "ENA", logo: "https://cdn.dexscreener.com/cms/images/0557c42577095f2f922ae1a1ba0b50a3ed07cb4dfdd3d2c45abb360d4f30523e?width=800&height=800&quality=95&format=auto", notes: "Synthetic dollar and yield. Utility on this card is the yield product.", launch: "utility", utility: "Yield", links: [{ name: "Website", url: "https://www.ethena.fi/" }, { name: "X", url: "https://twitter.com/ethena_labs" }, { name: "Telegram", url: "https://t.me/ethena_labs" }] },
  4: { name: "Brett", ticker: "BRETT", logo: "https://cdn.dexscreener.com/cms/images/86b556a0cb4ed7f3b6b6fecd16161f487dccebb89ed7d302b834fb1c0ce197b8?width=800&height=800&quality=95&format=auto", notes: "Base character meme. One of the names that kept showing up on Base trend lists.", links: [{ name: "Website", url: "https://www.basedbrett.com/" }, { name: "X", url: "https://twitter.com/BasedBrett" }, { name: "Telegram", url: "https://t.me/basedbrett" }] },
  5: { name: "dogwifhat", ticker: "WIF", logo: "https://cdn.dexscreener.com/cms/images/c3788335fe7010d9c32ede4f211118f4a703e0b47fee61cd503c33cc9cde242a?width=800&height=800&quality=95&format=auto", notes: "Dog in a hat. A long-running Solana meme that kept returning to trend.", links: [{ name: "Website", url: "https://dogwifcoin.org" }, { name: "X", url: "https://twitter.com/dogwifcoin" }, { name: "Telegram", url: "https://t.me/dogwifcoin" }] },
  6: { name: "Chainlink", ticker: "LINK", logo: "https://cdn.dexscreener.com/cms/images/af53a807c8fe1e69d36f70c5f5bc14bbdeaae67df61a343733fccdf5b8a78b33?width=800&height=800&quality=95&format=auto", notes: "Oracle network used by apps that need outside prices and data.", launch: "utility", utility: "Data feeds", links: [{ name: "Website", url: "https://chain.link/" }, { name: "X", url: "https://x.com/chainlink" }, { name: "Telegram", url: "https://t.me/chainlinkofficial" }, { name: "Discord", url: "https://discord.com/invite/chainlink" }] },
  7: { name: "Floki", ticker: "FLOKI", logo: "https://cdn.dexscreener.com/cms/images/066f9df15312c9fd28debc612c80e3f69e13b3c4b3b2576bd37ee18da67c10a9?width=800&height=800&quality=95&format=auto", notes: "Dog meme with a wide retail following across Ethereum and BNB.", links: [{ name: "Website", url: "https://floki.com/" }, { name: "X", url: "https://x.com/floki" }, { name: "Telegram", url: "https://t.me/FlokiInuToken" }] },
  8: { name: "Bonk", ticker: "BONK", logo: "https://cdn.dexscreener.com/cms/images/ba03c0370670d176dc33bbd212eb023337a460ad7edfa053ca96ae22f31c3dcf?width=800&height=800&quality=95&format=auto", notes: "Solana dog meme. Still one of the names people check when Solana is moving.", links: [{ name: "Website", url: "https://www.bonkcoin.com" }, { name: "X", url: "https://twitter.com/bonk_inu" }, { name: "Telegram", url: "https://t.me/Official_Bonk_Inu" }, { name: "Discord", url: "https://discord.gg/qaQa6M6mN2" }] },
  9: { name: "Mog Coin", ticker: "MOG", logo: "https://cdn.dexscreener.com/cms/images/830392e34129c07bc012bd814a2b0c1d0a385f4d7bd7ca6069246c402cc63de3?width=800&height=800&quality=95&format=auto", notes: "Cat meme. A regular name on Ethereum meme trend lists.", links: [{ name: "Website", url: "https://www.mogcoin.xyz/" }, { name: "X", url: "https://twitter.com/MogCoin" }, { name: "Telegram", url: "https://t.me/mogcoinYUP" }] },
  10: { name: "Toshi", ticker: "TOSHI", logo: "https://cdn.dexscreener.com/cms/images/81335196ed123df49cf07f60a69d9101630ca6a150edf22130bd46542e60bdca?width=800&height=800&quality=95&format=auto", notes: "Base cat meme named for Coinbase's cat. Often sits near the top of Base lists.", links: [{ name: "Website", url: "https://www.toshithecat.com/" }, { name: "X", url: "https://x.com/Toshi" }, { name: "Telegram", url: "https://t.me/toshibase" }] },
  11: { name: "Popcat", ticker: "POPCAT", logo: "https://cdn.dexscreener.com/cms/images/Pp6Fvh41hc0bHGK8?width=800&height=800&quality=95&format=auto", notes: "Popping-cat meme. A familiar Solana trend name.", links: [{ name: "Website", url: "https://www.popcatsolana.xyz/" }, { name: "X", url: "https://x.com/popcatworld" }, { name: "Telegram", url: "https://t.me/popcatsolana" }] },
  12: { name: "Virtuals", ticker: "VIRTUAL", logo: "https://cdn.dexscreener.com/cms/images/461f4a6b70979b82b7141adc522389c67043535a082d65accebf49013c798386?width=800&height=800&quality=95&format=auto", notes: "Protocol for launching AI agents. Utility on this card is the agent launch layer.", launch: "utility", utility: "AI agents", links: [{ name: "Website", url: "https://virtuals.io/" }, { name: "X", url: "https://twitter.com/virtuals_io" }, { name: "Telegram", url: "https://t.me/virtuals" }] },
  13: { name: "Baby Doge", ticker: "BABYDOGE", logo: "https://cdn.dexscreener.com/cms/images/a74a8fe677ffa2e2c73723109c13c90f79c197c77f5a5e4b2f187f61c7b7be31?width=800&height=800&quality=95&format=auto", notes: "Dog meme with a large holder community, mostly followed on BNB.", links: [{ name: "Website", url: "https://babydoge.com" }, { name: "X", url: "https://twitter.com/babydogecoin" }, { name: "Telegram", url: "https://t.me/babydogearmy" }] },
  14: { name: "SPX6900", ticker: "SPX", logo: "https://cdn.dexscreener.com/cms/images/0eb409d135760501b28367efc53d816c2ca471aa701ae7a825ab171f25974ad6?width=800&height=800&quality=95&format=auto", notes: "Index-joke meme. A name that kept circulating on Ethereum trend lists.", links: [{ name: "Website", url: "https://www.spx6900.com" }, { name: "Telegram", url: "https://t.me/SPX6900Portal" }] },
  15: { name: "Pudgy Penguins", ticker: "PENGU", logo: "https://cdn.dexscreener.com/cms/images/9d5188f603b49ab02f7a75e5d2c2959ec2947c98181501fb11688672e9394efd?width=800&height=800&quality=95&format=auto", notes: "Penguin collection token. Stayed visible after the brand moved onto Solana.", links: [{ name: "Website", url: "https://www.pudgypenguins.com" }, { name: "X", url: "https://x.com/pudgypenguins" }, { name: "Discord", url: "https://discord.gg/pudgypenguins" }] },
  16: { name: "Degen", ticker: "DEGEN", logo: "https://cdn.dexscreener.com/cms/images/c865067e6e29f660b5d0c2a69814875c7415c3fc0022434651525c21f03cc24a?width=800&height=800&quality=95&format=auto", notes: "Base community token tied to Farcaster tipping.", links: [{ name: "Website", url: "https://www.degen.tips/" }, { name: "X", url: "https://twitter.com/degentokenbase" }, { name: "Telegram", url: "https://t.me/degentokenbase" }] },
  17: { name: "Turbo", ticker: "TURBO", logo: "https://cdn.dexscreener.com/cms/images/dc98afaa920f78906d33d12ed37762b6958075062bd3c6b1dea9beac97400f67?width=800&height=800&quality=95&format=auto", notes: "Toad meme that stayed on Ethereum trend lists for a long stretch.", links: [{ name: "Website", url: "https://turbotoken.io/" }, { name: "X", url: "https://twitter.com/TurboToadToken" }, { name: "Telegram", url: "https://t.me/TurboToadToken" }] },
  18: { name: "cat in a dogs world", ticker: "MEW", logo: "https://cdn.dexscreener.com/cms/images/33effe52dd5b1f6574ca5baaca9c02fecdecb557607a2a72889ceb0537eae9be?width=800&height=800&quality=95&format=auto", notes: "Cat meme on Solana. A regular name when meme volume picks up.", links: [{ name: "Website", url: "https://mew.xyz/" }, { name: "X", url: "https://twitter.com/MewsWorld" }, { name: "Telegram", url: "https://t.me/mewsworld" }] },
  19: { name: "Cheems", ticker: "CHEEMS", logo: "https://cdn.dexscreener.com/cms/images/ed763d4c3440b863cde1b4bcbfbe507e8aee81e1479e8600b3dcbd9e27ebb7f8?width=800&height=800&quality=95&format=auto", notes: "Cheems dog meme followed mainly on BNB.", links: [{ name: "Website", url: "https://cheems.pet/" }, { name: "X", url: "https://x.com/LordCheems_bsc" }, { name: "Telegram", url: "https://t.me/LordCheems_Bsc" }] },
  20: { name: "aixbt", ticker: "AIXBT", logo: "https://cdn.dexscreener.com/cms/images/4a055ebd1f663f2b8564b0f02790d2e7a707facd1b5f0199c41e4ce680772354?width=800&height=800&quality=95&format=auto", notes: "Market-commentary agent from Virtuals. Utility on this card is the agent itself.", launch: "utility", utility: "Market agent", links: [{ name: "Website", url: "https://aixbt.tech" }, { name: "X", url: "https://x.com/aixbt_agent" }, { name: "Telegram", url: "https://t.me/aixbt_tech" }] },
};

function socials(id: string, links: Face["links"]) {
  return links.map((link) => {
    const path = link.url.split("/").filter(Boolean).pop() || "";
    return { id: `${id}-soc-${link.name.toLowerCase()}`, name: link.name, url: link.url, handle: link.name === "Website" ? "" : `@${path}`, password: "", note: "" };
  });
}

function project(input: {
  n: number;
  name: string;
  ticker: string;
  chain: string;
  launchpadId: string;
  status: ProjectStatus;
  launch?: LaunchKind;
  utility?: string;
  client: string;
  targetDate: string;
  rows: Row[];
  discountUsd?: number;
}): Project {
  const id = `proj-${String(input.n).padStart(2, "0")}`;
  const lineItems = input.n === 1 ? phaseOneShortlist().map((line) => ({ ...line, id: `${id}-${line.id}` })) : lines(id, input.rows);
  const checks = [...baselineChecks(), ...lineItems.flatMap((line) => makeChecks(line, services, packages))].map((check, index) => ({
    ...check,
    id: `${id}-chk-${index + 1}`,
  }));
  const face = FACE[input.n];
  return {
    id,
    name: face?.name || input.name,
    ticker: face?.ticker || input.ticker,
    logo: face?.logo || "",
    chain: "Robinhood",
    launchpadId: input.launchpadId,
    contract: CHAIN_FACTS[input.n]?.contract || "",
    supply: CHAIN_FACTS[input.n]?.supply || "",
    status: input.status,
    launch: face?.launch || input.launch || "meme",
    utility: (face?.launch || input.launch || "meme") === "meme" ? "" : face?.utility || input.utility || "",
    client: input.client,
    budgetUsd: 0,
    discountUsd: input.discountUsd || 0,
    discountNote: input.discountUsd ? "Desk discount" : "",
    sample: input.n === 1,
    notes: face?.notes || "Roster worksheet. Prices are the catalog rates, split by pre-launch, phase, and startup.",
    lineItems,
    checks,
    wallets: mockWallets(id),
    contactIds: [],
    socials: face ? socials(id, face.links) : [],
    logoPacks: [],
    bannerPacks: [],
    treasury: { ...emptyTreasury(), volumeBudgetUsd: input.rows.some((row) => row.refId === "volume-500k") ? 5000 : 0, mmWeeklyUsd: 1000 },
    createdAt: "2026-09-25T10:00:00.000Z",
    updatedAt: "2026-09-25T10:00:00.000Z",
    targetDate: input.targetDate,
  };
}

export function rosterProjects(): Project[] {
  const specs: Parameters<typeof project>[0][] = [
    { n: 1, name: "Sample launch", ticker: "DEMO", chain: "Ethereum", launchpadId: "pons", status: "quoted", client: "Internal sample", targetDate: "2026-10-09", rows: [], discountUsd: 350 },
    { n: 2, name: "Keel", ticker: "KEEL", chain: "Solana", launchpadId: "pump", status: "draft", client: "Desk", targetDate: "2026-10-12", rows: [ROWS.fomo12] },
    { n: 3, name: "Harbor", ticker: "HBR", chain: "Ethereum", launchpadId: "uniswap", status: "quoted", launch: "utility", utility: "Payments", client: "Desk", targetDate: "2026-10-14", rows: [ROWS.pack, ROWS.gmgnDay] },
    { n: 4, name: "Northline", ticker: "NLIN", chain: "Base", launchpadId: "clanker", status: "booked", client: "Desk", targetDate: "2026-10-16", rows: [ROWS.pre, ROWS.fomo24, ROWS.x1] },
    { n: 5, name: "Brine", ticker: "BRINE", chain: "Solana", launchpadId: "raydium", status: "live", client: "Desk", targetDate: "2026-10-02", rows: [ROWS.gmgnWeek, ROWS.x4] },
    { n: 6, name: "Lumen", ticker: "LUMEN", chain: "Ethereum", launchpadId: "pons", status: "quoted", launch: "utility", utility: "Staking", client: "Desk", targetDate: "2026-10-18", rows: [ROWS.fomo24, ROWS.rhList, ROWS.pons] },
    { n: 7, name: "Cinder", ticker: "CNDR", chain: "BNB Chain", launchpadId: "fourmeme", status: "draft", client: "Desk", targetDate: "2026-10-20", rows: [ROWS.pre] },
    { n: 8, name: "Marrow", ticker: "MRW", chain: "Solana", launchpadId: "meteora", status: "quoted", client: "Desk", targetDate: "2026-10-21", rows: [ROWS.pack, ROWS.x1] },
    { n: 9, name: "Vellum", ticker: "VELL", chain: "Ethereum", launchpadId: "curve", status: "booked", client: "Desk", targetDate: "2026-10-22", rows: [ROWS.fomo12, ROWS.gmgnDay, ROWS.volume] },
    { n: 10, name: "Sable", ticker: "SABLE", chain: "Base", launchpadId: "uniswap", status: "live", client: "Desk", targetDate: "2026-09-28", rows: [ROWS.rhTrend, ROWS.x4] },
    { n: 11, name: "Quartz", ticker: "QTZ", chain: "Solana", launchpadId: "moonshot", status: "draft", client: "Desk", targetDate: "2026-10-24", rows: [ROWS.gmgnDay] },
    { n: 12, name: "Ironclad", ticker: "IRON", chain: "Ethereum", launchpadId: "uniswap", status: "quoted", launch: "utility", utility: "Escrow", client: "Desk", targetDate: "2026-10-25", rows: [ROWS.pre, ROWS.pack, ROWS.fomo24] },
    { n: 13, name: "Drift", ticker: "DRIFT", chain: "BNB Chain", launchpadId: "pancakeswap", status: "booked", client: "Desk", targetDate: "2026-10-26", rows: [ROWS.x1, ROWS.gmgnWeek] },
    { n: 14, name: "Halcyon", ticker: "HLCN", chain: "Ethereum", launchpadId: "pons", status: "quoted", client: "Desk", targetDate: "2026-10-28", rows: [ROWS.rhList, ROWS.rhTrend, ROWS.pons] },
    { n: 15, name: "Pylon", ticker: "PYLON", chain: "Solana", launchpadId: "pump", status: "closed", client: "Desk", targetDate: "2026-09-12", rows: [ROWS.fomo12, ROWS.gmgnDay] },
    { n: 16, name: "Nimbus", ticker: "NMBS", chain: "Base", launchpadId: "clanker", status: "draft", client: "Desk", targetDate: "2026-11-02", rows: [ROWS.pre, ROWS.x4] },
    { n: 17, name: "Cobalt", ticker: "COB", chain: "Ethereum", launchpadId: "curve", status: "quoted", client: "Desk", targetDate: "2026-11-04", rows: [ROWS.pack, ROWS.volume] },
    { n: 18, name: "Fathom", ticker: "FTHM", chain: "Solana", launchpadId: "raydium", status: "live", client: "Desk", targetDate: "2026-10-01", rows: [ROWS.fomo24, ROWS.x1, ROWS.gmgnWeek] },
    { n: 19, name: "Relay", ticker: "RELAY", chain: "BNB Chain", launchpadId: "fourmeme", status: "booked", client: "Desk", targetDate: "2026-11-06", rows: [ROWS.rhList, ROWS.pre] },
    { n: 20, name: "Anchor", ticker: "ANCH", chain: "Ethereum", launchpadId: "pons", status: "quoted", launch: "utility", utility: "Treasury tools", client: "Desk", targetDate: "2026-11-08", rows: [ROWS.fomo24, ROWS.pack, ROWS.x4, ROWS.pons, ROWS.volume] },
  ];
  return specs.map(project);
}
