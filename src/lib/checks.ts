import { WORK_LANES } from "./labels";
import type { CheckItem, LineItem, Package, Project, Service } from "../types";

const BASELINE: { text: string; critical: boolean }[] = [
  { text: "Token name, ticker, and artwork locked", critical: true },
  { text: "Contract address recorded", critical: true },
  { text: "Launchpad and chain confirmed", critical: true },
  { text: "Liquidity plan signed off", critical: true },
  { text: "Hot wallets listed", critical: false },
  { text: "Plan approved", critical: true },
];

export function baselineChecks(): CheckItem[] {
  return BASELINE.map((item, index) => ({
    id: `base-${index}`,
    group: "Launch",
    text: item.text,
    done: false,
    critical: item.critical,
  }));
}

export function makeChecks(line: LineItem, services: Service[], packages: Package[]): CheckItem[] {
  const out: CheckItem[] = [];
  const push = (text: string, critical: boolean) => {
    out.push({
      id: `${line.id}-c${out.length}`,
      group: line.name,
      text,
      done: false,
      critical,
      lineItemId: line.id,
    });
  };

  if (line.source === "service" && line.refId) {
    const service = services.find((item) => item.id === line.refId);
    service?.requirements.forEach((item) => push(item.text, Boolean(item.critical)));
    service?.includes.forEach((item) => push(item.label, false));
  }

  if (line.source === "package" && line.refId) {
    const pack = packages.find((item) => item.id === line.refId);
    pack?.guarantees.forEach((item) => push(item, false));
    pack?.includes.forEach((item) => push(item.label, false));
    pack?.extras.forEach((item) => push(item, false));
  }

  return out;
}

export function checksInPhase(project: Project, phaseId: string): CheckItem[] {
  return project.checks.filter((check) => {
    if (check.phase) return check.phase === phaseId;
    const line = check.lineItemId ? project.lineItems.find((item) => item.id === check.lineItemId) : undefined;
    if (line) return line.phase === phaseId;
    return phaseId === "startup";
  });
}

export function checksByPhase(project: Project) {
  const tally = (checks: CheckItem[]) => ({
    done: checks.filter((check) => check.done).length,
    total: checks.length,
  });
  return WORK_LANES.map((lane) => ({ id: lane.id, label: lane.label, ...tally(checksInPhase(project, lane.id)) }));
}
