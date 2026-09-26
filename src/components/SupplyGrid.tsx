import Link from "next/link";
import { FactSheet } from "./FactSheet";
import { formatEth, formatUsd, money } from "../lib/format";
import { ROUTE_LABEL } from "../lib/labels";
import { SUPPLY_ROWS } from "../lib/treasury";
import type { SupplyRoute } from "../types";

export function SupplyGrid({
  route,
  pct,
  ethUsd,
  href,
  onPick,
}: {
  route: SupplyRoute;
  pct: number;
  ethUsd: number;
  href?: (pct: number) => string;
  onPick?: (id: string) => void;
}) {
  return (
    <div className="supply-grid">
      {SUPPLY_ROWS.map((row, index) => {
        const eth = row[route];
        const previous = index > 0 ? SUPPLY_ROWS[index - 1][route] : null;
        const on = row.pct === pct;
        const body = (
          <FactSheet
            label={`${row.pct}% share`}
            value={money(eth, "ETH")}
            cells={[
              ["Dollars", formatUsd(eth * ethUsd)],
              ["Step", previous == null ? "Base" : `+${formatEth(eth - previous)}`],
              ["Route", ROUTE_LABEL[route]],
              ["Ladder", "1.5× each 10%"],
            ]}
          />
        );
        if (href) return <Link key={row.pct} href={href(row.pct)} className={on ? "on" : undefined}>{body}</Link>;
        return <button key={row.pct} type="button" className={on ? "on" : undefined} onClick={() => onPick?.(`${row.pct}-${route}`)}>{body}</button>;
      })}
    </div>
  );
}
