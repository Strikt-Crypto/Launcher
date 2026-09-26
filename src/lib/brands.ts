const CHAIN_LOGOS: Record<string, string> = {
  Robinhood: "https://cdn.simpleicons.org/robinhood/00C805",
  Ethereum: "https://cdn.simpleicons.org/ethereum/627EEA",
  Solana: "https://icons.llamao.fi/icons/chains/rsz_solana.jpg",
  Base: "https://icons.llamao.fi/icons/chains/rsz_base.jpg",
  "BNB Chain": "/brands/binance.png",
  Arbitrum: "https://icons.llamao.fi/icons/chains/rsz_arbitrum.jpg",
  Polygon: "https://icons.llamao.fi/icons/chains/rsz_polygon.jpg",
  Avalanche: "https://icons.llamao.fi/icons/chains/rsz_avalanche.jpg",
};

export function chainLogo(name?: string) {
  if (!name) return "";
  return CHAIN_LOGOS[name] || "";
}
