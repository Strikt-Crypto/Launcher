import { money } from "./format";
import type { Service } from "../types";

export function servicePriceLabel(service: Service) {
  if (service.openPrice) return "Open";
  if (!service.tiers.length) return "—";
  const currency = service.tiers[0].currency;
  if (service.tiers.some((tier) => tier.currency !== currency)) return "Mixed";
  const min = Math.min(...service.tiers.map((tier) => tier.price));
  if (service.tiers.length === 1) return money(min, currency);
  return `From ${money(min, currency)}`;
}
