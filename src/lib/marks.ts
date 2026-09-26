import type { Package, Platform, Provider, Service } from "../types";

const DESK_LOGO: Record<string, string> = {};

const DESK_PLATFORM: Record<string, string> = {
  "fomo-desk": "fomo",
  "listing-desk": "dexscreener",
  "gmgn-desk": "gmgn",
  "robinhood-desk": "robinhood",
  "x-desk": "x",
  "pons-desk": "pons",
};

const SERVICE_PLATFORM: Record<string, string> = {
  "fomo-trending": "fomo",
  "listing-pack-1": "dexscreener",
  "gmgn-trending": "gmgn",
  "rh-listing": "robinhood",
  "rh-trending": "robinhood",
  "x-trending": "x",
  "pons-fee": "pons",
};

const PACKAGE_MARKS: Record<string, string> = {
  "robinhood-pack": "/brands/packages/robinhood-pack.svg?v=2",
  "pr-bronze": "/brands/packages/bronze.svg?v=2",
  "pr-silver": "/brands/packages/silver.svg?v=2",
  "pr-gold": "/brands/packages/gold.svg?v=2",
  "pr-platinum": "/brands/packages/platinum.svg?v=2",
  "pr-titanium": "/brands/packages/titanium.svg?v=2",
  "pr-platinum-plus": "/brands/packages/platinum-plus.svg?v=2",
  "pr-diamond": "/brands/packages/diamond.svg?v=2",
  "pr-diamond-elite": "/brands/packages/diamond-elite.svg?v=2",
  "pr-royal": "/brands/packages/royal.svg?v=2",
  "pr-god": "/brands/packages/god.svg?v=2",
  "artem-tier-1": "/brands/packages/artem-tier-1.svg?v=2",
};

const HOST_LOGOS: Record<string, string> = {
  "coinmarketcap.com": "https://coinmarketcap.com/apple-touch-icon.png",
  "cointelegraph.com": "https://cointelegraph.com/apple-touch-icon.png",
  "bitcoin.com": "https://bitcoin.com/apple-touch-icon.png",
  "tradingview.com": "https://s.tradingview.com/static/images/favicon/apple-touch-icon-180x180.png",
  "hackernoon.com": "https://hackernoon.com/apple-touch-icon.png",
  "cryptowisser.com": "https://cryptowisser.com/apple-touch-icon.png",
  "binance.com": "/brands/binance.png",
  "benzinga.com": "https://www.google.com/s2/favicons?domain=benzinga.com&sz=128",
  "apnews.com": "https://www.google.com/s2/favicons?domain=apnews.com&sz=128",
  "theblock.co": "https://www.google.com/s2/favicons?domain=theblock.co&sz=128",
  "news.google.com": "https://www.google.com/s2/favicons?domain=news.google.com&sz=128",
  "marketwatch.com": "https://www.google.com/s2/favicons?domain=marketwatch.com&sz=128",
  "businessinsider.com": "https://www.google.com/s2/favicons?domain=businessinsider.com&sz=128",
  "coinpedia.org": "https://www.google.com/s2/favicons?domain=coinpedia.org&sz=128",
  "fomo.family": "https://fomo.gg/images/Logo-icon.png",
  "pump.fun": "https://icons.llamao.fi/icons/protocols/pump.fun",
  "x.com": "https://abs.twimg.com/responsive-web/client-web/icon-ios.77d25eba.png",
};

const NAME_HOST: Record<string, string> = {
  ap: "apnews.com",
  apnews: "apnews.com",
  "google news": "news.google.com",
  benzinga: "benzinga.com",
  marketwatch: "marketwatch.com",
  "business insider": "businessinsider.com",
  tradingview: "tradingview.com",
  coinpedia: "coinpedia.org",
  coinmarketcap: "coinmarketcap.com",
  binance: "binance.com",
  "the block": "theblock.co",
  "the cointelegraph pr lite": "cointelegraph.com",
  "digital journal": "digitaljournal.com",
  menafn: "menafn.com",
  "bein crypto": "beincrypto.com",
  beincrypto: "beincrypto.com",
  "u.today": "u.today",
  "bitcoin.com": "bitcoin.com",
  hackernoon: "hackernoon.com",
  cryptowisser: "cryptowisser.com",
};

function hostOf(url?: string) {
  if (!url) return "";
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function platformById(platforms: Platform[], id?: string) {
  if (!id) return "";
  return platforms.find((item) => item.id === id)?.logo || "";
}

export function deskMark(provider: Provider, platforms: Platform[]) {
  return provider.logo || DESK_LOGO[provider.id] || platformById(platforms, DESK_PLATFORM[provider.id]);
}

export function serviceMark(service: Service, platforms: Platform[]) {
  return platformById(platforms, SERVICE_PLATFORM[service.id] || service.platformIds[0]);
}

export function outletMark(name: string, url: string | undefined, platforms: Platform[]) {
  const named = NAME_HOST[name.trim().toLowerCase()];
  const host = hostOf(url) || named;
  if (host && HOST_LOGOS[host]) return HOST_LOGOS[host];
  if (host) {
    const hit = platforms.find((item) => hostOf(item.url) === host);
    if (hit?.logo) return hit.logo;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
  }
  const key = name.trim().toLowerCase();
  const byName = platforms.find((item) => key === item.name.toLowerCase() || key.startsWith(`${item.name.toLowerCase()} `));
  return byName?.logo || "";
}

export function packageMark(pack: Package, _platforms: Platform[]) {
  if (pack.id.startsWith("supply-")) return "/brands/packages/supply.svg?v=2";
  if (pack.id.startsWith("vol-")) return "/brands/packages/volume.svg?v=2";
  return PACKAGE_MARKS[pack.id] || "";
}
