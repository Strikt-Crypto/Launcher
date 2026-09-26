import { CHANNEL, redisUrl, subscribeRedis } from "../../../../server/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!redisUrl()) return Response.json({ error: "REDIS_URL is not set" }, { status: 503 });
  const subscriber = subscribeRedis();
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      const beat = setInterval(() => send("ping", { at: new Date().toISOString() }), 15000);
      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(beat);
        subscriber.disconnect();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      request.signal.addEventListener("abort", close);
      subscriber.on("message", (_channel, message) => {
        try {
          send("update", JSON.parse(message) as unknown);
        } catch {
          send("update", { raw: message });
        }
      });
      await subscriber.subscribe(CHANNEL);
      send("ready", { channel: CHANNEL });
    },
    cancel() {
      closed = true;
      subscriber.disconnect();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
