import type { Wallet } from "../types";

const ROWS: { label: string; purpose: string }[] = [
  { label: "Deployer", purpose: "Deployer" },
  { label: "Execution", purpose: "Execution" },
  { label: "Buyback", purpose: "Buyback" },
];

function chunk(seed: number, length: number) {
  let n = seed || 1;
  let out = "";
  while (out.length < length) {
    n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
    out += n.toString(16).padStart(8, "0");
  }
  return out.slice(0, length);
}

export function mockWallets(projectId: string): Wallet[] {
  let seed = 2166136261;
  for (let i = 0; i < projectId.length; i++) seed = Math.imul(seed ^ projectId.charCodeAt(i), 16777619) >>> 0;
  return ROWS.map((row, index) => {
    const n = Math.imul(seed ^ (index + 1), 16777619) >>> 0;
    return {
      id: `${projectId}-mock-${index + 1}`,
      label: row.label,
      purpose: row.purpose,
      chain: "Robinhood",
      address: `0x${chunk(n, 40)}`,
      privateKey: `sample-${chunk(n ^ 0xabcdef, 32)}`,
    };
  });
}

export function walletsAreBlank(wallets: Wallet[] | undefined) {
  return !wallets?.length || wallets.every((wallet) => !wallet.address.trim() && !wallet.privateKey?.trim());
}
