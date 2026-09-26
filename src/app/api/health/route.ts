import { databaseUrl, getSql } from "../../../../server/db/client";
import { getRedis, redisUrl } from "../../../../server/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const status = { ok: true, service: "web", db: "down" as "up" | "down", redis: "down" as "up" | "down" };
  if (databaseUrl()) {
    try {
      await getSql()`select 1 as ok`;
      status.db = "up";
    } catch {
      status.db = "down";
    }
  }
  if (redisUrl()) {
    try {
      const pong = await getRedis().ping();
      status.redis = pong === "PONG" ? "up" : "down";
    } catch {
      status.redis = "down";
    }
  }
  return Response.json(status);
}
