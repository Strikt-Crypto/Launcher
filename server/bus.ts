import { CHANNEL, getRedis } from "./redis";

export type LauncherEvent =
  | { type: "token.synced"; tokenId: string; at: string }
  | { type: "token.indexed"; tokenId: string; source: string; kind: string; blockNumber: number | null; at: string }
  | { type: "desk.synced"; tokens: number; at: string };

export async function publish(event: LauncherEvent) {
  await getRedis().publish(CHANNEL, JSON.stringify(event));
}
