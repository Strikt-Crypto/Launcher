import { ROUTE_LABEL } from "../lib/labels";
import { formatEth, formatUsd } from "../lib/format";
import { SUPPLY_ROWS } from "../lib/treasury";
import type { SupplyPct, SupplyRoute } from "../types";

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
                <strong>{formatEth(row[key])}</strong>
                <div className="tiny">{formatUsd(row[key] * ethUsd)}</div>
                <div className="tiny">{ROUTE_LABEL[key]}</div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
