import Redis from "ioredis";

export const CHANNEL = "launcher:events";
export const QUEUE_NAME = "launcher";

const globalRedis = globalThis as { launcherRedis?: Redis };

export function redisUrl() {
  return process.env.REDIS_URL || "";
}

export function redisOptions() {
  const url = redisUrl();
  if (!url) throw new Error("REDIS_URL is not set");
  return { url, maxRetriesPerRequest: null as null };
}

export function getRedis() {
  if (!globalRedis.launcherRedis) {
    globalRedis.launcherRedis = new Redis(redisOptions().url, { maxRetriesPerRequest: null });
  }
  return globalRedis.launcherRedis;
}

export function subscribeRedis() {
  return new Redis(redisOptions().url, { maxRetriesPerRequest: null });
}

export async function closeRedis() {
  if (!globalRedis.launcherRedis) return;
  globalRedis.launcherRedis.disconnect();
  globalRedis.launcherRedis = undefined;
}
