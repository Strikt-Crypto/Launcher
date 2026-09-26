"use client";

import type { ReactNode } from "react";
import { ServerBridge } from "@/components/ServerBridge";
import { StoreProvider } from "@/store";
import { UiProvider } from "@/ui";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <UiProvider>
        <ServerBridge />
        {children}
      </UiProvider>
    </StoreProvider>
  );
}
