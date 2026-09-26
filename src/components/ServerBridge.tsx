"use client";

import { useEffect } from "react";
import { scrub } from "../lib/scrub";
import { useStore } from "../store";

export function ServerBridge() {
  const store = useStore();

  useEffect(() => {
    if (!store.ready) return;
    let source: EventSource | null = null;
    let stop = false;
    void (async () => {
      try {
        const health = (await fetch("/api/health").then((response) => response.json())) as { redis?: string };
        if (stop || health.redis !== "up") return;
        source = new EventSource("/api/stream");
        source.addEventListener("update", (event) => {
          try {
            const detail = JSON.parse((event as MessageEvent<string>).data) as unknown;
            window.dispatchEvent(new CustomEvent("launcher:index", { detail }));
          } catch {
            /* ignore a bad frame */
          }
        });
      } catch {
        /* the desk keeps working from the browser */
      }
    })();
    return () => {
      stop = true;
      source?.close();
    };
  }, [store.ready]);

  useEffect(() => {
    if (!store.ready) return;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const health = (await fetch("/api/health").then((response) => response.json())) as { db?: string; redis?: string };
          if (health.db !== "up" || health.redis !== "up") return;
          const body = JSON.stringify(scrub({
            settings: store.settings,
            projects: store.projects,
            contacts: store.contacts,
            services: store.services,
            packages: store.packages,
            providers: store.providers,
            platforms: store.platforms,
          }));
          await fetch("/api/desk/sync", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body,
          });
        } catch {
          /* the desk keeps working from the browser */
        }
      })();
    }, 800);
    return () => window.clearTimeout(timer);
  }, [store.ready, store.settings, store.projects, store.contacts, store.services, store.packages, store.providers, store.platforms]);

  return null;
}
