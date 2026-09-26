export type MarketMock = {
  marketCap: number;
  volume24h: number;
  volumeAll: number;
  change24h: number;
  changeAll: number;
};

function seed(id: string) {
  let n = 2166136261;
  for (let i = 0; i < id.length; i++) n = Math.imul(n ^ id.charCodeAt(i), 16777619);
  return n >>> 0;
}

export function mockMarket(id: string): MarketMock {
  const n = seed(id || "token");
  const marketCap = 12_000_000 + (n % 2400) * 1_000_000;
  const volume24h = 180_000 + ((n >>> 4) % 900) * 25_000;
  const volumeAll = volume24h * (30 + ((n >>> 8) % 120));
  const change24h = (((n >>> 12) % 2401) - 900) / 100;
  const changeAll = 40 + ((n >>> 16) % 6500);
  return { marketCap, volume24h, volumeAll, change24h, changeAll };
}
