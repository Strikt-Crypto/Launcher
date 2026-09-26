import { createHash } from "crypto";

export type TokenRow = {
  id: string;
  name: string;
  ticker: string;
  chain: string;
  contract: string;
  supply: string;
  status: string;
};

export type Pull = {
  source: "desk" | "rpc";
  kind: "snapshot" | "head";
  blockNumber: number | null;
  payload: Record<string, unknown>;
};

function deskPayload(token: TokenRow): Record<string, unknown> {
  return {
    name: token.name,
    ticker: token.ticker,
    chain: token.chain,
    contract: token.contract,
    supply: token.supply,
    status: token.status,
  };
}

function isEvmAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

async function rpcCall(url: string, method: string, params: unknown[]) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`RPC ${response.status}`);
  const body = (await response.json()) as { result?: unknown; error?: { message?: string } };
  if (body.error) throw new Error(body.error.message || "RPC error");
  return body.result;
}

function hexQuantity(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("0x")) return null;
  return Number(BigInt(value));
}

function totalSupplyOf(value: unknown) {
  if (typeof value !== "string" || !/^0x[a-fA-F0-9]{64}$/.test(value)) return null;
  return BigInt(value).toString();
}

export function stateHash(pull: Pull) {
  return createHash("sha256").update(JSON.stringify(pull.payload)).digest("hex");
}

export async function pullToken(token: TokenRow): Promise<Pull> {
  const rpc = process.env.CHAIN_RPC_URL || "";
  const contract = token.contract || "";
  if (!rpc || !isEvmAddress(contract)) {
    return { source: "desk", kind: "snapshot", blockNumber: null, payload: deskPayload(token) };
  }
  const blockHex = await rpcCall(rpc, "eth_blockNumber", []);
  const code = await rpcCall(rpc, "eth_getCode", [contract, "latest"]);
  const supplyHex = await rpcCall(rpc, "eth_call", [{ to: contract, data: "0x18160ddd" }, "latest"]).catch(() => null);
  const bytecode = typeof code === "string" ? code : "0x";
  return {
    source: "rpc",
    kind: "head",
    blockNumber: hexQuantity(blockHex),
    payload: {
      ...deskPayload(token),
      blockNumber: hexQuantity(blockHex),
      bytecodeBytes: bytecode === "0x" ? 0 : Math.max(0, (bytecode.length - 2) / 2),
      totalSupply: totalSupplyOf(supplyHex),
    },
  };
}
