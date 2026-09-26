import { databaseUrl, getSql } from "../../../../server/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!databaseUrl()) return Response.json({ error: "DATABASE_URL is not set" }, { status: 503 });
  const tokenId = new URL(request.url).searchParams.get("tokenId");
  try {
    const sql = getSql();
    if (tokenId) {
      const rows = await sql`
        select id, token_id, source, kind, block_number, payload, created_at
        from index_events
        where token_id = ${tokenId}
        order by created_at desc
        limit 20
      `;
      return Response.json({ events: rows });
    }
    const rows = await sql`
      select token_id, source, block_number, state_hash, cursor_at
      from index_cursors
      order by cursor_at desc
      limit 100
    `;
    return Response.json({ cursors: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Index read failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
