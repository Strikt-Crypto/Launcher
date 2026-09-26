const CHAIN_LOGOS: Record<string, string> = {
  Robinhood: "https://cdn.simpleicons.org/robinhood/00C805",
  Ethereum: "https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg",
  Solana: "https://icons.llamao.fi/icons/chains/rsz_solana.jpg",
  Base: "https://icons.llamao.fi/icons/chains/rsz_base.jpg",
  "BNB Chain": "/brands/binance.png",
  Arbitrum: "https://icons.llamao.fi/icons/chains/rsz_arbitrum.jpg",
  Polygon: "https://icons.llamao.fi/icons/chains/rsz_polygon.jpg",
  Avalanche: "https://icons.llamao.fi/icons/chains/rsz_avalanche.jpg",
};

const SOCIAL_LOGOS: Record<string, string> = {
  X: "https://abs.twimg.com/responsive-web/client-web/icon-ios.77d25eba.png",
  Twitter: "https://abs.twimg.com/responsive-web/client-web/icon-ios.77d25eba.png",
  Telegram: "https://cdn.simpleicons.org/telegram/26A5E4",
  Discord: "https://cdn.simpleicons.org/discord/5865F2",
  Instagram: "https://cdn.simpleicons.org/instagram/E4405F",
  TikTok: "https://cdn.simpleicons.org/tiktok/EE1D52",
  YouTube: "https://cdn.simpleicons.org/youtube/FF0033",
  Website: "https://cdn.simpleicons.org/googlechrome/4285F4",
  Email: "https://cdn.simpleicons.org/gmail/EA4335",
};

export function chainLogo(name?: string) {
  if (!name) return "";
  return CHAIN_LOGOS[name] || "";
}

export function socialLogo(name?: string) {
  if (!name) return "";
  return SOCIAL_LOGOS[name] || "";
}
