"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { uid } from "./lib/id";
import type { PhaseId } from "./types";

export type AddRequest = {
  projectId?: string;
  serviceId?: string;
  packageId?: string;
  tierId?: string;
  phase?: PhaseId;
  countries?: string[];
  callers?: string[];
  nonce: number;
};

type Toast = { id: string; text: string };

type Ui = {
  add: AddRequest | null;
  openAdd: (req: Omit<AddRequest, "nonce">) => void;
  closeAdd: () => void;
  toasts: Toast[];
  toast: (text: string) => void;
};

const Ctx = createContext<Ui | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [add, setAdd] = useState<AddRequest | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nonce = useRef(0);

  const api: Ui = {
    add,
    openAdd: (req) => {
      nonce.current += 1;
      setAdd({ ...req, nonce: nonce.current });
    },
    closeAdd: () => setAdd(null),
    toasts,
    toast: (text) => {
      const id = uid("toast");
      setToasts((current) => [...current, { id, text }]);
      window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 3200);
    },
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useUi() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("UI missing");
  return ctx;
}
