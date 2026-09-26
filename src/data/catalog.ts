import type { Package, Requirement, Service, Tier } from "../types";

const fomoRequirements: Requirement[] = [
  { id: "lp", text: "LP · 40K+ · on the Fomo UI", critical: true },
  { id: "v1", text: "1H volume · 10K+", critical: true },
  { id: "v24", text: "24H volume · 250K+", critical: true },
  { id: "charts", text: "Charts · Green", critical: true },
  { id: "warn", text: "Warnings · None on Fomo", critical: true },
];

const fomoDrop = "If LP or volume drops below the requirements, the token may be removed from trending. It still counts until the requirements are fixed.";

function fomo(id: string, hours: string, price: number): Service {
  const tier: Tier = { id: hours, label: hours, price, currency: "USD", duration: hours, note: "Ranks 1–10" };
  return {
    id,
    name: `FOMO Trending 1–10 · ${hours}`,
    phase: "phase-1",
    kind: "service",
    summary: `${hours} in FOMO trending, ranks 1 through 10.`,
    details: "",
    notes: fomoDrop,
    tiers: [tier],
    requirements: fomoRequirements,
    includes: [],
    rules: [],
    providerId: "fomo-desk",
    contactId: "con-mock-4",
    platformIds: ["fomo"],
    links: [],
    chains: [],
    available: true,
  };
}

function gmgn(id: string, window: string, price: number): Service {
  const tier: Tier = { id: window, label: window, price, currency: "USD", duration: window, note: "1–5 · mostly 1–3" };
  return {
    id,
    name: `GMGN Trending 1–5 · ${window}`,
    phase: "phase-1",
    kind: "service",
    summary: `${window} of GMGN trending. Positions 1–5, mostly 1–3.`,
    details: "",
    notes: fomoDrop,
    tiers: [tier],
    requirements: [
      { id: "lp", text: "LP · 40K+ · on the GMGN UI", critical: true },
      { id: "v1", text: "1H volume · 10K+", critical: true },
      { id: "v24", text: "24H volume · 250K+", critical: true },
      { id: "charts", text: "Charts · Green", critical: true },
      { id: "warn", text: "Warnings · None on GMGN", critical: true },
    ],
    includes: [],
    rules: [],
    providerId: "gmgn-desk",
    contactId: "con-mock-2",
    platformIds: ["gmgn"],
    links: [],
    chains: [],
    available: true,
  };
}

const walletBars: Requirement[] = [
  { id: "lp", text: "LP · 40K+ · on Robinhood Wallet", critical: true },
  { id: "v1", text: "1H volume · 10K+", critical: true },
  { id: "v24", text: "24H volume · 250K+", critical: true },
  { id: "charts", text: "Charts · Green", critical: true },
  { id: "warn", text: "Warnings · None on Robinhood", critical: true },
];

function robinhoodListing(): Service {
  return {
    id: "rh-wallet-listing",
    name: "Robinhood Wallet Listing",
    phase: "phase-1",
    kind: "service",
    summary: "Robinhood wallet listing is available.",
    details: "",
    notes: "Robinhood wallet listing is available.",
    tiers: [{ id: "list", label: "Available", price: 1000, currency: "USD", duration: "Listing" }],
    requirements: walletBars,
    includes: [],
    rules: [],
    providerId: "robinhood-desk",
    contactId: "con-mock-5",
    platformIds: ["robinhood"],
    links: [],
    chains: [],
    available: true,
  };
}

function robinhoodTrending(): Service {
  return {
    id: "rh-wallet-trending-24h",
    name: "Robinhood Wallet Trending · 24 hours",
    phase: "phase-1",
    kind: "service",
    summary: "24 hours of Robinhood wallet trending.",
    details: "",
    notes: fomoDrop,
    tiers: [{ id: "24h", label: "24 hours", price: 1200, currency: "USD", duration: "24 hours", note: "Robinhood" }],
    requirements: walletBars,
    includes: [],
    rules: [],
    providerId: "robinhood-desk",
    contactId: "con-mock-5",
    platformIds: ["robinhood"],
    links: [],
    chains: [],
    available: true,
  };
}

const xNote = "Cashtag or wording. Worldwide is included. You can choose 4 countries.";

function xTrend(id: string, hours: string, price: number): Service {
  const tier: Tier = { id: hours, label: hours, price, currency: "USD", duration: hours };
  return {
    id,
    name: `X Trending — Worldwide · ${hours}`,
    phase: "phase-2",
    kind: "service",
    summary: `${hours} of worldwide X trending. Cashtag or wording. Up to 4 countries, worldwide included.`,
    details: "",
    notes: xNote,
    tiers: [tier],
    requirements: [],
    includes: [],
    rules: [],
    providerId: "x-desk",
    contactId: "con-mock-2",
    platformIds: ["x"],
    links: [],
    chains: [],
    available: true,
    countryPick: { max: 4, includesWorldwide: true },
  };
}

export const services: Service[] = [
  fomo("fomo-trending-12h", "12 hours", 1500),
  fomo("fomo-trending-24h", "24 hours", 2500),
  gmgn("gmgn-trending-1d", "1 day", 550),
  gmgn("gmgn-trending-1w", "1 week", 2000),
  robinhoodListing(),
  robinhoodTrending(),
  xTrend("x-trending-1h", "1 hour", 700),
  xTrend("x-trending-2h", "2 hours", 1300),
  xTrend("x-trending-4h", "4 hours", 2400),
  xTrend("x-trending-6h", "6 hours", 3000),
  xTrend("x-trending-12h", "12 hours", 5500),
  xTrend("x-trending-24h", "24 hours", 8500),
  {
    id: "mod-teams",
    name: "Mod teams",
    phase: "phase-1",
    kind: "service",
    summary: "24/7 coverage across Telegram, X and Discord. Two experienced teams of six.",
    details: "",
    notes: "Reliable, active and ready to work.\n\nBrothers does not take any commission or payment for recommending these teams. They have been around us for many years, and we simply like to support them by helping them find work.\n\nReach out directly to Team leads if your project needs full-time community support.\n\nTeam leads\n@MyMod02\n@MyMod001",
    tiers: [{ id: "cover", label: "24/7", price: 0, currency: "USD", duration: "Telegram, X, Discord", note: "Two teams of six" }],
    requirements: [],
    includes: [
      { label: "Moderate", note: "Protect the community" },
      { label: "Chats", note: "Keep them active and engaging" },
      { label: "Raids", note: "Support social activity" },
      { label: "Groups", note: "Set up and manage Telegram" },
      { label: "Thesis", note: "A strong project thesis for FOMO" },
      { label: "Assist", note: "Wherever the community needs them" },
    ],
    rules: [],
    providerId: "community",
    contactId: "con-mock-2",
    platformIds: [],
    links: [],
    chains: [],
    available: true,
    openPrice: true,
  },
];

const SITE_URL: Record<string, string> = {
  "ap news": "https://apnews.com",
  ap: "https://apnews.com",
  "digital journal": "https://www.digitaljournal.com",
  "google news": "https://news.google.com",
  barchart: "https://www.barchart.com",
  benzinga: "https://www.benzinga.com",
  menafn: "https://menafn.com",
  "business insider": "https://www.businessinsider.com",
  marketwatch: "https://www.marketwatch.com",
  tradingview: "https://www.tradingview.com",
  coinpedia: "https://coinpedia.org",
  coinmarketcap: "https://coinmarketcap.com",
  binance: "https://www.binance.com",
  hackernoon: "https://hackernoon.com",
  invezz: "https://invezz.com",
  "crypto.news": "https://crypto.news",
  newsbtc: "https://www.newsbtc.com",
  bitcoinist: "https://bitcoinist.com",
  mpost: "https://mpost.io",
  cryptowisser: "https://cryptowisser.com",
  "analytics insight": "https://www.analyticsinsight.net",
  captainaltcoin: "https://captainaltcoin.com",
  coinjournal: "https://coinjournal.net",
  coincu: "https://coincu.com",
  coinedition: "https://coinedition.com",
  techbullion: "https://techbullion.com",
  thenewscrypto: "https://thenewscrypto.com",
  "bitcoin.com": "https://bitcoin.com",
  beincrypto: "https://beincrypto.com",
  "u.today": "https://u.today",
  streetinsider: "https://www.streetinsider.com",
  cryptoslate: "https://cryptoslate.com",
  "the block": "https://www.theblock.co",
  "cointelegraph pr lite": "https://cointelegraph.com",
};

function article(rank: number, slug: string, name: string, price: number, reach: string, extra: string, names: string[], note: string, extras: string[] = []): Package {
  return {
    id: `article-pr-${slug}`,
    name,
    rank,
    group: "pr",
    phase: "phase-2",
    price,
    currency: "USD",
    summary: `Article PR. ${reach}.`,
    guarantees: [reach, extra],
    outlets: names.map((site) => {
      const url = SITE_URL[site.toLowerCase()];
      return url ? { name: site, url } : { name: site };
    }),
    extras,
    providerId: "pr-desk",
    includes: [],
    notes: note,
  };
}

function articlePackages(): Package[] {
  const press = ["Hackernoon", "Invezz", "Crypto.news", "Benzinga", "NewsBTC", "Bitcoinist", "Mpost", "Cryptowisser", "Analytics Insight", "CaptainAltcoin", "Coinjournal", "Coincu", "CoinEdition", "Techbullion", "TheNewsCrypto", "CoinMarketCap", "Binance"];
  return [
    article(1, "10", "Article PR · 10+ crypto sites", 350, "10+ crypto sites", "15 named sites", ["Bitcoingress", "Cryptomustar", "Eielle", "Cryptocrunches", "Cryptoddy", "Coinpress", "Coinopening", "Bitswage", "Smartstaker", "Wagebits", "YourCryptoPR", "Cyptonic", "CryptoExploit", "CryptoPressNews", "Crypto Unfold"], "Guaranteed on 10+ crypto sites."),
    article(2, "news", "Article PR · Google News", 800, "100+ news sites", "Google News", ["AP News", "Digital Journal"], "Google News syndication. Featured on AP News, Digital Journal, and 100+ niche and crypto news sites."),
    article(3, "200", "Article PR · 200+ platforms", 1200, "200+ platforms", "6 named outlets", ["AP", "Barchart", "Benzinga", "Digital Journal", "MENAFN", "Google News"], "Featured on AP, Barchart, Benzinga, Digital Journal, MENAFN, and Google News. 200+ platforms."),
    article(4, "450", "Article PR · 450+ outlets", 1600, "450+ outlets", "8 named outlets", ["Business Insider", "MarketWatch", "TradingView", "AP", "Barchart", "Benzinga", "Digital Journal", "MENAFN"], "Featured on Business Insider, MarketWatch, TradingView, AP, Barchart, Benzinga, Digital Journal, and MENAFN. 450+ major outlets."),
    article(5, "300", "Article PR · 300+ placements", 2100, "300+ placements", "1–2 day delivery", ["Digital Journal", "Business Insider", "MarketWatch", "Benzinga", "CoinPedia", "CoinMarketCap", "Binance", "TradingView"], "300+ guaranteed placements. Free content. Delivery in 1–2 days. Campaign report included.", ["Free content", "1–2 day delivery", "Campaign report"]),
    article(6, "100", "Article PR · 100+ links", 6000, "100+ PR links", "17 named outlets", press, "100+ guaranteed article links."),
    article(7, "190", "Article PR · 190+ links", 8500, "190+ PR links", "19 named outlets", ["Bitcoin.com", "AP", ...press], "190+ guaranteed article links."),
    article(8, "290", "Article PR · 290+ links", 10750, "290+ PR links", "21 named outlets", ["BeInCrypto", "U.Today", "Bitcoin.com", "Business Insider", "Digital Journal", "StreetInsider", "MarketWatch", "Hackernoon", "Invezz", "Crypto.news", "CryptoSlate", "Benzinga", "NewsBTC", "Bitcoinist", "Mpost", "Cryptowisser", "Analytics Insight", "CaptainAltcoin", "CoinEdition", "CoinMarketCap", "Binance"], "290+ guaranteed article links."),
    article(9, "block", "Article PR · The Block", 13000, "390+ PR links", "The Block", ["The Block", "Bitcoin.com", "Crypto.news", "BeInCrypto", "U.Today", "Business Insider", "Digital Journal", "StreetInsider", "MarketWatch", "Hackernoon", "Invezz", "CryptoSlate", "Benzinga", "NewsBTC", "Cryptowisser", "CoinMarketCap", "Binance"], "390+ guaranteed article links, featured on The Block."),
    article(10, "cointelegraph", "Article PR · CoinTelegraph", 18500, "390+ PR links", "CoinTelegraph PR Lite", ["CoinTelegraph PR Lite", "Bitcoin.com", "Crypto.news", "BeInCrypto", "U.Today", "Business Insider", "Digital Journal", "StreetInsider", "MarketWatch", "Hackernoon", "Invezz", "CryptoSlate", "Benzinga", "NewsBTC", "Bitcoinist", "Mpost", "Cryptowisser", "CoinMarketCap", "Binance"], "390+ guaranteed article links, featured on CoinTelegraph PR Lite."),
  ];
}

const narrativeNote = "We don't burn the whole budget at once. We set aside budget for 4 KOLs but pay 2 first. We watch their buy pressure, let the chart push through the next resistance and hold there, then immediately pay the next 2. Then we repeat in waves. This way every dollar goes into buy pressure we've actually seen work, not into guesses.";

const narrativePackage: Package = {
  id: "artem-tier-1",
  name: "Narrative & GTM",
  rank: 1,
  group: "bundle",
  phase: "prelaunch",
  price: 12000,
  currency: "USD",
  summary: "Tier 1. Narrative positioning, GTM preparation, and KOL coordination.",
  guarantees: ["5 narrative options", "GTM preparation", "KOL coordination at 10% of the KOL budget"],
  extras: [],
  providerId: "artem",
  includes: [
    { label: "Narrative", note: "5 options" },
    { label: "GTM", note: "Preparation" },
    { label: "Coordination", note: "10% of KOL budget" },
    { label: "Deck", url: "https://drive.google.com/file/d/1wMItO9HTtIHNavOpuRLjT_rbvIIU1J4B/view?usp=drive_link" },
  ],
  notes: narrativeNote,
  outlets: [
    { name: "@erics_calls", url: "https://fomo.family/profile/EricCryptoman", price: 10000, note: "buys on fomo · quoted $7–10k", group: "Post + buy" },
    { name: "@MakeMoneyWithMattTG", price: 3000, note: "TG and X post · ~$3k", group: "Post + buy" },
    { name: "@J7tradingjournal", url: "https://pump.fun/profile/4UrFSCrGxgoCtCUBAEZq7ZmPK3Pczkxx7PwYnkBMi1KR", price: 10000, note: "top 3 on pump.fun · quoted $7–10k", group: "Post + buy" },
    { name: "@LevisAlpha", url: "https://fomo.family/profile/LevisNFT", price: 12000, note: "wallet buy and TG post", group: "Post + buy" },
    { name: "maurits", url: "https://fomo.family/profile/mauritsneo", price: 5000, note: "post + buy", group: "Post + buy", links: [{ label: "X", url: "https://x.com/mauritsneo" }] },
    { name: "@houseofdegeneracy", url: "https://pump.fun/profile/DrJ6SnDXkEsPeGdmSs93v5rwWumv5QMvAGSZjAyWSd5o", price: 7000, note: "buy + post", group: "Post + buy" },
    { name: "Juicycooks", url: "https://fomo.family/profile/Juicycooks", price: 6000, note: "fomo buy and post", group: "Post + buy", links: [{ label: "X", url: "https://x.com/Juicycooks" }] },
    { name: "@manifestingriches", url: "https://fomo.family/profile/RachelWolchin", price: 5000, note: "thesis and TG post", group: "Post + buy" },
    { name: "0x3mp1r3", url: "https://fomo.family/profile/0x3mp1r3", price: 6500, note: "FOMO buy", group: "Mainly fomo buyers" },
    { name: "BTCFORLIFE", url: "https://fomo.family/profile/BTCFORLIFE", price: 6500, note: "FOMO buy", group: "Mainly fomo buyers" },
    { name: "The__Solstice", url: "https://fomo.family/profile/The__Solstice", price: 30000, note: "FOMO buy", group: "Mainly fomo buyers" },
    { name: "NDF_Sonar_trade", url: "https://fomo.family/profile/NDF_Sonar_trade", price: 15000, note: "FOMO buy", group: "Mainly fomo buyers" },
    { name: "trancey", url: "https://fomo.family/profile/trancey", price: 13000, note: "FOMO buy", group: "Mainly fomo buyers" },
    { name: "xbrazilzz", url: "https://fomo.family/profile/xbrazilzz", price: 10000, note: "FOMO buy", group: "Mainly fomo buyers" },
    { name: "smokey0x", url: "https://fomo.family/profile/smokey0x", price: 12000, note: "FOMO buy", group: "Mainly fomo buyers" },
    { name: "Zagy998", url: "https://fomo.family/profile/Zagy998", price: 10000, note: "FOMO buy", group: "Mainly fomo buyers" },
    { name: "cryptolyxe", url: "https://fomo.family/profile/cryptolyxe", price: 18000, note: "FOMO buy", group: "Mainly fomo buyers" },
  ],
};

export const packages: Package[] = [...articlePackages(), narrativePackage];
