import { Worker } from "bullmq";
import { closeSql } from "./db/client";
import { migrate } from "./db/migrate";
import { indexToken } from "./jobs/indexToken";
import type { IndexJob } from "./queue";
import { closeRedis, QUEUE_NAME, redisOptions } from "./redis";

async function shutdown(worker: Worker) {
  await worker.close();
  await closeRedis();
  await closeSql();
  process.exit(0);
}

async function main() {
  await migrate();
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      if (job.name !== "index.token") throw new Error(`Unknown job ${job.name}`);
      const data = job.data as IndexJob;
      return indexToken(data.tokenId);
    },
    { connection: redisOptions(), concurrency: 4 },
  );
  worker.on("failed", (job, error) => {
    console.error(`job ${job?.id || "?"} failed`, error.message);
  });
  console.log("worker up");
  process.on("SIGTERM", () => void shutdown(worker));
  process.on("SIGINT", () => void shutdown(worker));
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
