import { syncDesk, type DeskSnapshot } from "../../../../../server/desk";
import { databaseUrl } from "../../../../../server/db/client";
import { migrate } from "../../../../../server/db/migrate";
import { redisUrl } from "../../../../../server/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!databaseUrl() || !redisUrl()) return Response.json({ error: "Database and Redis are not configured" }, { status: 503 });
  let body: DeskSnapshot;
  try {
    body = (await request.json()) as DeskSnapshot;
  } catch {
    return Response.json({ error: "Expected a desk snapshot" }, { status: 400 });
  }
  if (!body || !Array.isArray(body.projects)) return Response.json({ error: "Expected projects" }, { status: 400 });
  try {
    await migrate();
    const result = await syncDesk(body);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
