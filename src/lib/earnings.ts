import type { Earning, PhaseId, Project } from "../types";

export function earningEntries(project: Project): Earning[] {
  const raw = project.earnings as unknown;
  if (Array.isArray(raw)) {
    return raw.filter((item): item is Earning => Boolean(item) && typeof item.amount === "number" && typeof item.phase === "string");
  }
  if (raw && typeof raw === "object") {
    return Object.entries(raw as Record<string, number>).flatMap(([phase, amount]) => {
      const value = Number(amount) || 0;
      if (!value) return [];
      return [{ id: `earn-${phase}`, phase: phase as PhaseId, amount: value, note: "" }];
    });
  }
  return [];
}

export function earnedIn(project: Project, phase: PhaseId) {
  return earningEntries(project).filter((item) => item.phase === phase).reduce((total, item) => total + item.amount, 0);
}
