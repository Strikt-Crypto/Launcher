import { ROUTE_LABEL } from "../lib/labels";
import { SUPPLY_ROWS } from "../lib/treasury";
import type { SupplyPct, SupplyRoute } from "../types";

function eth(amount: number) {
  return `${amount.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ETH`;
}

function usd(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

export function SupplyPicker({
  pct,
  route,
  ethUsd,
  onChange,
}: {
  pct: SupplyPct | null;
  route: SupplyRoute | null;
  ethUsd: number;
  onChange: (pct: SupplyPct, route: SupplyRoute) => void;
}) {
  return (
    <div className="supply">
      <div />
      <div className="tiny">V1 · Uniswap V3</div>
      <div className="tiny">V2 · Curve, then V4</div>
      {SUPPLY_ROWS.map((row) => (
        <div key={row.pct} style={{ display: "contents" }}>
          <div className="tiny">Buy {row.pct}%</div>
          {(["v1", "v2"] as SupplyRoute[]).map((key) => {
            const on = pct === row.pct && route === key;
            return (
              <button key={key} type="button" className={on ? "on" : ""} onClick={() => onChange(row.pct, key)}>
                <strong>{eth(row[key])}</strong>
                <div className="tiny">{usd(row[key] * ethUsd)}</div>
                <div className="tiny">{ROUTE_LABEL[key]}</div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
