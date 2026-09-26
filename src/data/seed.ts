import type { AppState } from "../types";
import { packages, services } from "./catalog";
import { platforms } from "./platforms";
import { providers } from "./providers";
import { rosterProjects } from "./roster";

export function seedState(): AppState {
  return {
    version: 1,
    settings: { deskName: "Launcher", ethUsd: 3500, eurUsd: 1.08 },
    providers,
    platforms,
    services,
    packages,
    projects: rosterProjects(),
    contacts: [],
  };
}

export function isState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") return false;
  const state = value as AppState;
  return state.version === 1 && Array.isArray(state.projects) && Array.isArray(state.services) && Boolean(state.settings);
}
