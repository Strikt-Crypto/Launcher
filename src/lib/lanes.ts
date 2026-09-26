import { launchKindOf } from "./labels";
import type { AppState, AssetPack, Contact, PhaseId, TreasuryKey } from "../types";

const STARTUP_REFS = new Set(["pons-fee", "hot-wallets", "supply-buy", "supply-buy-v2", "volume-500k", "mm-budget", "mm-cost", "mm-retainer"]);

function normalizeContact(contact: Contact): Contact {
  return {
    ...contact,
    name: contact.name || "",
    title: contact.title || "",
    phone: contact.phone || "",
    email: contact.email || "",
    company: contact.company || "",
    note: contact.note || "",
    image: contact.image || "",
    links: (contact.links || []).map((link) => ({
      ...link,
      name: link.name || "",
      url: link.url || "",
      handle: link.handle || "",
    })),
  };
}

function normalizePack(pack: AssetPack): AssetPack {
  return {
    id: pack.id,
    name: pack.name || "Pack",
    link: pack.link || "",
    files: (pack.files || []).map((file) => ({ id: file.id, name: file.name || "File", data: file.data || "" })),
  };
}

export function canonicalPhase(phase: PhaseId, refId?: string, key?: TreasuryKey): PhaseId {
  if (key === "mkt-pre" || refId === "mkt-pre") return "prelaunch";
  if (key === "mkt-p1" || refId === "mkt-phase1") return "phase-1";
  if (key === "pons" || key === "supply" || key === "volume" || key === "mm-budget" || key === "mm-weeks") return "startup";
  if (refId && STARTUP_REFS.has(refId)) return "startup";
  if (phase === "treasury") return "startup";
  return phase;
}

export function normalizeState(state: AppState): AppState {
  return {
    ...state,
    services: state.services.map((service) => ({ ...service, phase: canonicalPhase(service.phase, service.id) })),
    contacts: (state.contacts || []).map(normalizeContact),
    projects: state.projects.map((project) => ({
      ...project,
      logo: project.logo || "",
      launch: launchKindOf(project.launch).id,
      utility: project.utility || "",
      wallets: (project.wallets || []).map((wallet) => ({ ...wallet, privateKey: wallet.privateKey || "", group: wallet.group === "supply" ? "supply" : "hot" })),
      contactIds: [...new Set((project.contactIds || []).filter((id) => typeof id === "string" && id))],
      socials: (project.socials || []).map((social) => ({
        ...social,
        url: social.url || "",
        handle: social.handle || "",
        password: social.password || "",
        note: social.note || "",
      })),
      logoPacks: (project.logoPacks || []).map(normalizePack),
      bannerPacks: (project.bannerPacks || []).map(normalizePack),
      lineItems: project.lineItems.map((line) => ({
        ...line,
        phase: canonicalPhase(line.phase, line.refId, line.meta?.treasuryKey),
      })),
    })),
  };
}
