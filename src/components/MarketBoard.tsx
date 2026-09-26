import { formatCompactUsd, formatPct } from "../lib/format";
import { mockMarket } from "../lib/mockMarket";

export function MarketBoard({ id }: { id: string }) {
  const market = mockMarket(id);
  const day = market.change24h >= 0 ? "sage" : "clay";
  const life = market.changeAll >= 0 ? "sage" : "clay";
  return (
    <div className="market-board">
      <div className="market-hero">
        <div>
          <span>Market cap</span>
          <strong>{formatCompactUsd(market.marketCap)}</strong>
        </div>
        <b className={day}>{formatPct(market.change24h)}<i>24h</i></b>
      </div>
      <div className="market-tiles">
        <div><span>Vol 24h</span><strong>{formatCompactUsd(market.volume24h)}</strong></div>
        <div><span>Vol all</span><strong>{formatCompactUsd(market.volumeAll)}</strong></div>
        <div><span>All time</span><strong className={life}>{formatPct(market.changeAll)}</strong></div>
      </div>
    </div>
  );
}
