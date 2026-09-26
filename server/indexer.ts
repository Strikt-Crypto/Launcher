import { migrate } from "./db/migrate";
import { closeSql, getSql } from "./db/client";
import { closeQueue, enqueueIndex } from "./queue";
import { closeRedis } from "./redis";

const intervalMs = Number(process.env.INDEX_INTERVAL_MS || 15000);

async function tick() {
  const sql = getSql();
  const tokens = await sql<{ id: string }[]>`
    select id from tokens
    order by updated_at desc
  `;
  for (const token of tokens) {
    await enqueueIndex(token.id);
  }
  return tokens.length;
}

async function shutdown() {
  await closeQueue();
  await closeRedis();
  await closeSql();
  process.exit(0);
}

async function main() {
  await migrate();
  const queued = await tick();
  console.log(`indexer up, queued ${queued}`);
  const timer = setInterval(() => {
    void tick().catch((error: unknown) => {
      console.error("indexer tick", error instanceof Error ? error.message : error);
    });
  }, Number.isFinite(intervalMs) && intervalMs >= 1000 ? intervalMs : 15000);
  process.on("SIGTERM", () => {
    clearInterval(timer);
    void shutdown();
  });
  process.on("SIGINT", () => {
    clearInterval(timer);
    void shutdown();
  });
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
