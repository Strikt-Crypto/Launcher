import { publish } from "../bus";
import { getSql } from "../db/client";
import { pullToken, stateHash, type TokenRow } from "../indexer/pull";

export async function indexToken(tokenId: string) {
  const sql = getSql();
  const rows = await sql<TokenRow[]>`
    select id, name, ticker, chain, contract, supply, status
    from tokens
    where id = ${tokenId}
  `;
  const token = rows[0];
  if (!token) return { skipped: true as const };

  const pull = await pullToken(token);
  const hash = stateHash(pull);
  const cursors = await sql<{ state_hash: string }[]>`
    select state_hash from index_cursors where token_id = ${tokenId}
  `;
  if (cursors[0]?.state_hash === hash) return { unchanged: true as const };

  await sql.begin(async (tx) => {
    await tx`
      insert into index_events (token_id, source, kind, block_number, payload)
      values (${tokenId}, ${pull.source}, ${pull.kind}, ${pull.blockNumber}, ${tx.json(JSON.parse(JSON.stringify(pull.payload)) as never)})
    `;
    await tx`
      insert into index_cursors (token_id, source, block_number, state_hash, cursor_at)
      values (${tokenId}, ${pull.source}, ${pull.blockNumber}, ${hash}, now())
      on conflict (token_id) do update
      set source = excluded.source,
          block_number = excluded.block_number,
          state_hash = excluded.state_hash,
          cursor_at = now()
    `;
  });

  await publish({
    type: "token.indexed",
    tokenId,
    source: pull.source,
    kind: pull.kind,
    blockNumber: pull.blockNumber,
    at: new Date().toISOString(),
  });
  return { indexed: true as const, source: pull.source };
}
