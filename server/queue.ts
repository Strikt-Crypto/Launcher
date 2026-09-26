import { Queue } from "bullmq";
import { QUEUE_NAME, redisOptions } from "./redis";

const globalQueue = globalThis as { launcherQueue?: Queue };

export type IndexJob = { tokenId: string };

export function getQueue() {
  if (!globalQueue.launcherQueue) {
    globalQueue.launcherQueue = new Queue(QUEUE_NAME, { connection: redisOptions() });
  }
  return globalQueue.launcherQueue;
}

export async function enqueueIndex(tokenId: string) {
  const queue = getQueue();
  const jobId = `index:${tokenId}`;
  const existing = await queue.getJob(jobId);
  if (existing) {
    const state = await existing.getState();
    if (state === "active" || state === "waiting" || state === "delayed" || state === "prioritized") return;
    await existing.remove();
  }
  await queue.add("index.token", { tokenId } satisfies IndexJob, {
    jobId,
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: true,
    removeOnFail: 50,
  });
}

export async function closeQueue() {
  if (!globalQueue.launcherQueue) return;
  await globalQueue.launcherQueue.close();
  globalQueue.launcherQueue = undefined;
}
