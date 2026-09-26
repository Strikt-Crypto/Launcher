export const AVG_SWAP_USD = 1000;
export const GAS_PER_SWAP_USD = 5;
export const VOLUME_STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

export function volumePlan(thousands: number) {
  const volumeUsd = thousands * 1000;
  const swaps = volumeUsd / AVG_SWAP_USD;
  const gasUsd = swaps * GAS_PER_SWAP_USD;
  const budgetUsd = thousands * 10;
  return { volumeUsd, swaps, gasUsd, budgetUsd, totalUsd: budgetUsd + gasUsd };
}
