import { ROUTE_LABEL } from "../lib/labels";
import { SUPPLY_ROWS } from "../lib/treasury";
import { AVG_SWAP_USD, GAS_PER_SWAP_USD, VOLUME_STEPS, volumePlan } from "../lib/volume";
import type { IncludeItem, Outlet, Package, SupplyRoute } from "../types";

const URLS: Record<string, string> = {
  AP: "https://apnews.com",
  APnews: "https://apnews.com",
  "Digital Journal": "https://www.digitaljournal.com",
  "Google News": "https://news.google.com",
  Barchart: "https://www.barchart.com",
  Benzinga: "https://www.benzinga.com",
  MENAFN: "https://menafn.com",
  "Business Insider": "https://www.businessinsider.com",
  MarketWatch: "https://www.marketwatch.com",
  TradingView: "https://www.tradingview.com",
  CoinPedia: "https://coinpedia.org",
  CoinMarketCap: "https://coinmarketcap.com",
  Binance: "https://www.binance.com",
  "The Block": "https://www.theblock.co",
  "The CoinTelegraph PR Lite": "https://cointelegraph.com",
  "Bitcoin.com": "https://bitcoin.com",
  BeInCrypto: "https://beincrypto.com",
  "U.Today": "https://u.today",
};

function outlet(name: string): Outlet {
  if (URLS[name]) return { name, url: URLS[name] };
  const domain = name.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) return { name, url: `https://${domain.toLowerCase()}` };
  return { name };
}

function outlets(names: string[]) {
  return names.map(outlet);
}

const bronzeSites = [
  "Bitcoingress",
  "Cryptomustar",
  "Eielle",
  "Cryptocrunches",
  "Cryptoddy",
  "Coinpress",
  "Coinopening",
  "Bitswage",
  "Smartstaker",
  "Wagebits",
  "YourCryptoPR",
  "Cyptonic",
  "CryptoExploit",
  "CryptoPressNews",
  "Crypto Unfold",
];

function pr(
  id: string,
  rank: number,
  name: string,
  price: number,
  summary: string,
  guarantees: string[],
  names: string[],
  extras: string[] = [],
): Package {
  return {
    id,
    name,
    rank,
    group: "pr",
    phase: "phase-3",
    price,
    currency: "USD",
    summary,
    guarantees,
    outlets: outlets(names),
    extras,
    providerId: "pr-desk",
    includes: [],
  };
}

const robinhoodIncludes: IncludeItem[] = [
  { label: "GMGN hot searches trend · 24 hours", url: "https://gmgn.ai" },
  { label: "X trending · 1 hour · 4 countries and worldwide", url: "https://x.com" },
  { label: "GeckoTerminal search bar and pool trend · 24 hours", url: "https://www.geckoterminal.com" },
  { label: "Binance hot search trend · 24 hours", url: "https://www.binance.com" },
];

export const packages: Package[] = [
  {
    id: "robinhood-pack",
    name: "Robinhood Pack",
    rank: 0,
    group: "bundle",
    phase: "bundle",
    price: 1299,
    currency: "USD",
    summary: "One pack across GMGN hot search, X, GeckoTerminal, and Binance search.",
    guarantees: ["One pack at $1,299"],
    outlets: [],
    extras: [],
    providerId: "robinhood-desk",
    includes: robinhoodIncludes,
  },
  pr("pr-bronze", 1, "Bronze Package", 350, "Entry placement across crypto sites.", ["Guaranteed on 10+ crypto sites"], bronzeSites),
  pr("pr-silver", 2, "Silver Package", 800, "Syndication plus a wider crypto-site net.", ["Google News syndication", "100+ niche and crypto news sites"], ["APnews", "Digital Journal"]),
  pr("pr-gold", 3, "Gold Package", 1200, "Named finance wires and a 200-site net.", ["200+ platforms"], ["AP", "Barchart", "Benzinga", "Digital Journal", "MENAFN", "Google News"]),
  pr("pr-platinum", 4, "Platinum Package", 1600, "Major outlets, with the Gold list still inside.", ["450+ major outlets"], ["Business Insider", "MarketWatch", "TradingView", "AP", "Barchart", "Benzinga", "Digital Journal", "MENAFN"]),
  pr(
    "pr-titanium",
    5,
    "Titanium Package",
    2100,
    "Exchange and market-data names, plus a written report.",
    ["300+ guaranteed placements"],
    ["Digital Journal", "Business Insider", "MarketWatch", "Benzinga", "CoinPedia", "CoinMarketCap", "Binance", "TradingView"],
    ["Free content", "1–2 day delivery", "Campaign report included"],
  ),
  pr("pr-platinum-plus", 6, "Platinum+ Package", 6000, "First premium tier. One hundred guaranteed links.", ["100+ guaranteed PR links"], ["Hackernoon.com", "Invezz.com", "Crypto.news", "Benzinga.com", "NewsBTC.com", "Bitcoinist.com", "Mpost.io", "Cryptowisser.com", "Analyticsinsight.net", "CaptainAltcoin.com", "Coinjournal.net", "Coincu.com", "CoinEdition.com", "Techbullion.com", "Thenewscrypto.com", "CoinMarketCap.com", "Binance.com"]),
  pr("pr-diamond", 7, "Diamond Package", 8500, "Premium net with Bitcoin.com and AP added.", ["190+ guaranteed PR links"], ["Bitcoin.com", "AP", "Hackernoon.com", "Invezz.com", "Crypto.news", "Benzinga.com", "NewsBTC.com", "Bitcoinist.com", "Mpost.io", "Cryptowisser.com", "Analyticsinsight.net", "CaptainAltcoin.com", "Coinjournal.net", "Coincu.com", "CoinEdition.com", "Techbullion.com", "Thenewscrypto.com", "CoinMarketCap.com", "Binance.com"]),
  pr("pr-diamond-elite", 8, "Diamond Elite Package", 10750, "Broader major-press list and a larger link count.", ["290+ guaranteed PR links"], ["BeInCrypto", "U.Today", "Bitcoin.com", "BusinessInsider.com", "DigitalJournal.com", "StreetInsider.com", "MarketWatch.com", "Hackernoon.com", "Invezz.com", "Crypto.news", "CryptoSlate.com", "Benzinga.com", "NewsBTC.com", "Bitcoinist.com", "Mpost.io", "Cryptowisser.com", "Analyticsinsight.net", "CaptainAltcoin.com", "CoinEdition.com", "CoinMarketCap.com", "Binance.com"]),
  pr("pr-royal", 9, "Royal Diamond Package", 13000, "The Block enters the feature list.", ["390+ guaranteed PR links"], ["The Block", "Bitcoin.com", "Crypto.news", "BeInCrypto.com", "U.Today", "BusinessInsider.com", "DigitalJournal.com", "StreetInsider.com", "MarketWatch.com", "Hackernoon.com", "Invezz.com", "CryptoSlate.com", "Benzinga.com", "NewsBTC.com", "Cryptowisser.com", "CoinMarketCap.com", "Binance.com"]),
  pr("pr-god", 10, "God Mode Package", 18500, "Top of the ladder, including CoinTelegraph PR Lite.", ["390+ guaranteed PR links"], ["The CoinTelegraph PR Lite", "Bitcoin.com", "Crypto.news", "BeInCrypto.com", "U.Today", "BusinessInsider.com", "DigitalJournal.com", "StreetInsider.com", "MarketWatch.com", "Hackernoon.com", "Invezz.com", "CryptoSlate.com", "Benzinga.com", "NewsBTC.com", "Bitcoinist.com", "Mpost.io", "Cryptowisser.com", "CoinMarketCap.com", "Binance.com"]),
  {
    id: "artem-tier-1",
    name: "Tier 1",
    rank: 1,
    group: "bundle",
    phase: "prelaunch",
    price: 12000,
    currency: "USD",
    summary: "Narrative positioning, GTM preparation, and KOL coordination. Caller prices sit on the sheet and are booked on their own.",
    guarantees: ["5 narrative options", "GTM preparation", "KOL coordination at 10% of the KOL budget"],
    extras: ["Caller prices are approximate and move with the project.", "Mainly fomo buyers can add a post if it is agreed."],
    providerId: "artem",
    includes: [
      { label: "Narrative positioning · 5 options" },
      { label: "GTM preparation" },
      { label: "KOL coordination · 10% of KOL budget" },
      { label: "Tier 1 deck", url: "https://drive.google.com/file/d/1wMItO9HTtIHNavOpuRLjT_rbvIIU1J4B/view?usp=drive_link" },
    ],
    outlets: [
      { name: "@erics_calls", url: "https://fomo.family/profile/EricCryptoman", note: "$7–10k · post + buy on fomo", group: "Post + buy" },
      { name: "@MakeMoneyWithMattTG", note: "~$3k · TG and X post + buy", group: "Post + buy" },
      { name: "@J7tradingjournal", url: "https://pump.fun/profile/4UrFSCrGxgoCtCUBAEZq7ZmPK3Pczkxx7PwYnkBMi1KR", note: "$7–10k · posts + buy · top 3 on pump.fun", group: "Post + buy" },
      { name: "@LevisAlpha", url: "https://fomo.family/profile/LevisNFT", note: "$12k · wallet buy + TG post", group: "Post + buy" },
      { name: "maurits", url: "https://fomo.family/profile/mauritsneo", note: "$5k · post + buy", group: "Post + buy", links: [{ label: "FOMO", url: "https://fomo.family/profile/mauritsneo" }, { label: "X", url: "https://x.com/mauritsneo" }] },
      { name: "@houseofdegeneracy", url: "https://pump.fun/profile/DrJ6SnDXkEsPeGdmSs93v5rwWumv5QMvAGSZjAyWSd5o", note: "$7k · buy + post", group: "Post + buy" },
      { name: "Juicycooks", url: "https://fomo.family/profile/Juicycooks", note: "$6k · fomo buy + post", group: "Post + buy", links: [{ label: "FOMO", url: "https://fomo.family/profile/Juicycooks" }, { label: "X", url: "https://x.com/Juicycooks" }] },
      { name: "@manifestingriches", url: "https://fomo.family/profile/RachelWolchin", note: "$5k · fomo buy with thesis + TG post", group: "Post + buy" },
      { name: "0x3mp1r3", url: "https://fomo.family/profile/0x3mp1r3", note: "$6.5k", group: "Mainly fomo buyers" },
      { name: "BTCFORLIFE", url: "https://fomo.family/profile/BTCFORLIFE", note: "$6.5k", group: "Mainly fomo buyers" },
      { name: "The__Solstice", url: "https://fomo.family/profile/The__Solstice", note: "$30k", group: "Mainly fomo buyers" },
      { name: "NDF_Sonar_trade", url: "https://fomo.family/profile/NDF_Sonar_trade", note: "$15k", group: "Mainly fomo buyers" },
      { name: "trancey", url: "https://fomo.family/profile/trancey", note: "$13k", group: "Mainly fomo buyers" },
      { name: "xbrazilzz", url: "https://fomo.family/profile/xbrazilzz", note: "$10k", group: "Mainly fomo buyers" },
      { name: "smokey0x", url: "https://fomo.family/profile/smokey0x", note: "$12k", group: "Mainly fomo buyers" },
      { name: "Zagy998", url: "https://fomo.family/profile/Zagy998", note: "$10k", group: "Mainly fomo buyers" },
      { name: "cryptolyxe", url: "https://fomo.family/profile/cryptolyxe", note: "$18k", group: "Mainly fomo buyers" },
    ],
  },
  ...SUPPLY_ROWS.flatMap((row) => (["v1", "v2"] as SupplyRoute[]).map((route): Package => ({
    id: `supply-${row.pct}-${route}`,
    name: `Buy ${row.pct}% · ${route === "v1" ? "Uniswap V3" : "Curve, then V4"}`,
    rank: row.pct,
    group: "budget",
    phase: "startup",
    price: row[route],
    currency: "ETH",
    summary: `${ROUTE_LABEL[route]}. ${row.pct === 30 ? "30% follows the same 1.5× step as the 40, 50, and 60 percent rows." : "Cost from the Ethereum supply sheet."}`,
    guarantees: [`${row.pct}% of supply`],
    outlets: [],
    extras: [ROUTE_LABEL[route]],
    providerId: "treasury-desk",
    includes: [{ label: ROUTE_LABEL[route], note: `${row[route]} ETH` }],
  }))),
  ...VOLUME_STEPS.map((step): Package => {
    const plan = volumePlan(step);
    const label = step === 1000 ? "1M" : `${step}K`;
    return {
      id: `vol-${step}k`,
      name: `Volume ${label} / 24H`,
      rank: step,
      group: "budget",
      phase: "startup",
      price: plan.budgetUsd,
      currency: "USD",
      summary: `Price is the budget. Gas is what the swaps lose. Average swap is $${AVG_SWAP_USD.toLocaleString("en-US")} at $${GAS_PER_SWAP_USD} gas each.`,
      guarantees: [`${plan.swaps.toLocaleString("en-US")} swaps`],
      outlets: [],
      extras: [`Average swap $${AVG_SWAP_USD.toLocaleString("en-US")}`, `Gas lost $${plan.gasUsd.toLocaleString("en-US")}`],
      providerId: "treasury-desk",
      includes: [
        { label: "Swaps", note: plan.swaps.toLocaleString("en-US") },
        { label: "Gas lost", note: `$${plan.gasUsd.toLocaleString("en-US")}` },
      ],
    };
  }),
];
