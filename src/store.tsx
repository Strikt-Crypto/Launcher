"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isState, seedState } from "./data/seed";
import { normalizeState } from "./lib/lanes";
import { mockContactProjects, mockContacts } from "./data/mockContacts";
import { mockWallets, walletsAreBlank } from "./lib/mockWallets";
import { makeChecks } from "./lib/checks";
import { nowIso, uid } from "./lib/id";
import { treasuryDraft } from "./lib/treasury";
import type { AppState, CheckItem, Contact, LineItem, Package, Platform, Project, Provider, Service, SocialAccount, TreasuryKey, Wallet } from "./types";

const STORAGE_KEY = "ledger.v1";

type Store = AppState & {
  ready: boolean;
  updateSettings: (patch: Partial<AppState["settings"]>) => void;
  resetData: () => void;
  replaceState: (next: AppState) => void;
  addProvider: (provider: Provider) => void;
  updateProvider: (id: string, patch: Partial<Provider>) => void;
  deleteProvider: (id: string) => void;
  addPlatform: (platform: Platform) => void;
  updatePlatform: (id: string, patch: Partial<Platform>) => void;
  deletePlatform: (id: string) => void;
  addService: (service: Service) => void;
  updateService: (id: string, patch: Partial<Service>) => void;
  deleteService: (id: string) => void;
  addPackage: (pack: Package) => void;
  updatePackage: (id: string, patch: Partial<Package>) => void;
  deletePackage: (id: string) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addLine: (projectId: string, line: LineItem, withChecks?: boolean) => void;
  updateLine: (projectId: string, lineId: string, patch: Partial<LineItem>) => void;
  removeLine: (projectId: string, lineId: string) => void;
  moveLine: (projectId: string, lineId: string, dir: -1 | 1) => void;
  addCheck: (projectId: string, check: CheckItem) => void;
  toggleCheck: (projectId: string, checkId: string) => void;
  removeCheck: (projectId: string, checkId: string) => void;
  addWallet: (projectId: string, wallet: Wallet) => void;
  updateWallet: (projectId: string, walletId: string, patch: Partial<Wallet>) => void;
  removeWallet: (projectId: string, walletId: string) => void;
  addContact: (contact: Contact) => void;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  attachContact: (projectId: string, contactId: string) => void;
  detachContact: (projectId: string, contactId: string) => void;
  addSocial: (projectId: string, social: SocialAccount) => void;
  updateSocial: (projectId: string, socialId: string, patch: Partial<SocialAccount>) => void;
  removeSocial: (projectId: string, socialId: string) => void;
  postTreasury: (projectId: string, key: TreasuryKey) => void;
};

const Ctx = createContext<Store | null>(null);

const SEED_NAMES = new Set(["Sample launch", "Keel", "Harbor", "Northline", "Brine", "Lumen", "Cinder", "Marrow", "Vellum", "Sable", "Quartz", "Ironclad", "Drift", "Halcyon", "Pylon", "Nimbus", "Cobalt", "Fathom", "Relay", "Anchor"]);

function paintRoster(state: AppState): AppState {
  const seeded = seedState();
  const fresh = new Map(seeded.projects.map((project) => [project.id, project]));
  const freshPlatforms = new Map(seeded.platforms.map((platform) => [platform.id, platform]));
  const freshProviders = new Map(seeded.providers.map((provider) => [provider.id, provider]));
  return {
    ...state,
    settings: { ...state.settings, deskName: state.settings.deskName === "Ledger" || state.settings.deskName === "Token desk" ? "Launcher" : state.settings.deskName },
    contacts: [
      ...(state.contacts || []).map((contact) => {
        const next = mockContacts.find((item) => item.id === contact.id);
        if (!next) return contact;
        return {
          ...contact,
          providerId: contact.providerId || next.providerId,
          company: /desk/i.test(contact.company) ? next.company : contact.company,
          title: contact.title === "Trending buyer" || /desk/i.test(contact.title) ? next.title : contact.title,
          note: contact.note === "Places FOMO and GMGN trending windows." ? next.note : contact.note.replace(/ for the desk/i, ""),
        };
      }),
      ...mockContacts.filter((contact) => !(state.contacts || []).some((item) => item.id === contact.id)),
    ].filter((contact) => contact.id !== "con-mod-02" && contact.id !== "con-mod-001"),
    packages: seeded.packages.map((pack) => {
      const prev = state.packages.find((item) => item.id === pack.id);
      return prev?.notes ? { ...pack, notes: prev.notes } : pack;
    }),
    services: seeded.services.map((service) => {
      const prev = state.services.find((item) => item.id === service.id);
      if (!prev || !("notes" in prev)) return service;
      if (service.id === "mod-teams" && prev.notes && !prev.notes.includes("@MyMod02")) {
        return { ...service, notes: `${prev.notes.trim()}\n\nTeam leads\n@MyMod02\n@MyMod001` };
      }
      return { ...service, notes: prev.notes };
    }),
    providers: [
      ...state.providers.map((provider) => {
        const next = freshProviders.get(provider.id);
        return next ? { ...provider, name: next.name, role: next.role, about: next.about, logo: next.logo || "" } : provider;
      }),
      ...seeded.providers.filter((provider) => !state.providers.some((item) => item.id === provider.id)),
    ],
    platforms: state.platforms.map((platform) => {
      const next = freshPlatforms.get(platform.id);
      return next ? { ...platform, logo: next.logo || "", chains: next.chains, ...(next.url ? { url: next.url } : {}) } : platform;
    }),
    projects: state.projects.map((project) => {
      const next = fresh.get(project.id);
      const seeded = Boolean(next && SEED_NAMES.has(project.name));
      return {
        ...project,
        chain: "Robinhood",
        contactIds: [...new Set([...(project.contactIds || []), ...(mockContactProjects[project.id] || [])])],
        wallets: walletsAreBlank(project.wallets)
          ? mockWallets(project.id)
          : (project.wallets || []).map((wallet) => ({ ...wallet, chain: "Robinhood" })),
        checks: project.checks.map((check) => check.text === "Quote approved" ? { ...check, text: "Plan approved" } : check),
        notes: project.notes.replace("the desk discount", "the discount").replace("Frog meme. This card stays the Phase 1 working sheet, with the discount on the seeded rows.", ""),
        client: project.client === "Desk" ? "House" : project.client,
        discountNote: project.discountNote === "Desk discount" ? "Discount" : project.discountNote,
        ...(next ? { contract: project.contract || next.contract, supply: project.supply || next.supply } : {}),
        ...(seeded && next
          ? { name: next.name, ticker: next.ticker, logo: next.logo, notes: next.notes, socials: next.socials, launch: next.launch, utility: next.utility }
          : {}),
      };
    }),
  };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed: unknown = JSON.parse(raw);
    if (!isState(parsed)) return seedState();
    const next = paintRoster(normalizeState(parsed));
    if (!next.projects.some((project) => project.id === "proj-20")) {
      return { ...next, projects: seedState().projects };
    }
    return next;
  } catch {
    return seedState();
  }
}

function touch(project: Project, patch: Partial<Project>): Project {
  return { ...project, ...patch, updatedAt: nowIso() };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(seedState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const api = useMemo<Store>(() => {
    const mapProject = (id: string, fn: (project: Project) => Project) => {
      setState((current) => ({
        ...current,
        projects: current.projects.map((project) => (project.id === id ? fn(project) : project)),
      }));
    };

    return {
      ...state,
      ready: hydrated,
      updateSettings: (patch) => setState((current) => ({ ...current, settings: { ...current.settings, ...patch } })),
      resetData: () => setState(seedState()),
      replaceState: (next) => setState(normalizeState(next)),
      addProvider: (provider) => setState((current) => ({ ...current, providers: [provider, ...current.providers] })),
      updateProvider: (id, patch) =>
        setState((current) => ({
          ...current,
          providers: current.providers.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      deleteProvider: (id) => setState((current) => ({ ...current, providers: current.providers.filter((item) => item.id !== id) })),
      addPlatform: (platform) => setState((current) => ({ ...current, platforms: [platform, ...current.platforms] })),
      updatePlatform: (id, patch) =>
        setState((current) => ({
          ...current,
          platforms: current.platforms.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      deletePlatform: (id) => setState((current) => ({ ...current, platforms: current.platforms.filter((item) => item.id !== id) })),
      addService: (service) => setState((current) => ({ ...current, services: [service, ...current.services] })),
      updateService: (id, patch) =>
        setState((current) => ({
          ...current,
          services: current.services.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      deleteService: (id) => setState((current) => ({ ...current, services: current.services.filter((item) => item.id !== id) })),
      addPackage: (pack) => setState((current) => ({ ...current, packages: [...current.packages, pack] })),
      updatePackage: (id, patch) =>
        setState((current) => ({
          ...current,
          packages: current.packages.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      deletePackage: (id) => setState((current) => ({ ...current, packages: current.packages.filter((item) => item.id !== id) })),
      addProject: (project) => setState((current) => ({ ...current, projects: [project, ...current.projects] })),
      updateProject: (id, patch) => mapProject(id, (project) => touch(project, patch)),
      deleteProject: (id) => setState((current) => ({ ...current, projects: current.projects.filter((item) => item.id !== id) })),
      addLine: (projectId, line, withChecks = false) =>
        mapProject(projectId, (project) => {
          const extra = withChecks ? makeChecks(line, state.services, state.packages) : [];
          return touch(project, { lineItems: [...project.lineItems, line], checks: [...project.checks, ...extra] });
        }),
      updateLine: (projectId, lineId, patch) =>
        mapProject(projectId, (project) =>
          touch(project, {
            lineItems: project.lineItems.map((line) => (line.id === lineId ? { ...line, ...patch } : line)),
          }),
        ),
      removeLine: (projectId, lineId) =>
        mapProject(projectId, (project) =>
          touch(project, {
            lineItems: project.lineItems.filter((line) => line.id !== lineId),
            checks: project.checks.filter((check) => check.lineItemId !== lineId),
          }),
        ),
      moveLine: (projectId, lineId, dir) =>
        mapProject(projectId, (project) => {
          const index = project.lineItems.findIndex((line) => line.id === lineId);
          const next = index + dir;
          if (index < 0 || next < 0 || next >= project.lineItems.length) return project;
          const items = project.lineItems.slice();
          const [row] = items.splice(index, 1);
          items.splice(next, 0, row);
          return touch(project, { lineItems: items });
        }),
      addCheck: (projectId, check) => mapProject(projectId, (project) => touch(project, { checks: [...project.checks, check] })),
      toggleCheck: (projectId, checkId) =>
        mapProject(projectId, (project) =>
          touch(project, {
            checks: project.checks.map((check) => (check.id === checkId ? { ...check, done: !check.done } : check)),
          }),
        ),
      removeCheck: (projectId, checkId) =>
        mapProject(projectId, (project) => touch(project, { checks: project.checks.filter((check) => check.id !== checkId) })),
      addWallet: (projectId, wallet) => mapProject(projectId, (project) => touch(project, { wallets: [...project.wallets, wallet] })),
      updateWallet: (projectId, walletId, patch) =>
        mapProject(projectId, (project) =>
          touch(project, { wallets: project.wallets.map((wallet) => (wallet.id === walletId ? { ...wallet, ...patch } : wallet)) }),
        ),
      removeWallet: (projectId, walletId) =>
        mapProject(projectId, (project) => touch(project, { wallets: project.wallets.filter((wallet) => wallet.id !== walletId) })),
      addContact: (contact) => setState((current) => ({ ...current, contacts: [contact, ...(current.contacts || [])] })),
      updateContact: (id, patch) =>
        setState((current) => ({
          ...current,
          contacts: (current.contacts || []).map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      deleteContact: (id) =>
        setState((current) => ({
          ...current,
          contacts: (current.contacts || []).filter((item) => item.id !== id),
          projects: current.projects.map((project) => ({
            ...project,
            contactIds: (project.contactIds || []).filter((item) => item !== id),
          })),
        })),
      attachContact: (projectId, contactId) =>
        mapProject(projectId, (project) => {
          const ids = project.contactIds || [];
          if (ids.includes(contactId)) return project;
          return touch(project, { contactIds: [...ids, contactId] });
        }),
      detachContact: (projectId, contactId) =>
        mapProject(projectId, (project) => touch(project, { contactIds: (project.contactIds || []).filter((item) => item !== contactId) })),
      addSocial: (projectId, social) => mapProject(projectId, (project) => touch(project, { socials: [...(project.socials || []), social] })),
      updateSocial: (projectId, socialId, patch) =>
        mapProject(projectId, (project) =>
          touch(project, { socials: (project.socials || []).map((social) => (social.id === socialId ? { ...social, ...patch } : social)) }),
        ),
      removeSocial: (projectId, socialId) =>
        mapProject(projectId, (project) => touch(project, { socials: (project.socials || []).filter((social) => social.id !== socialId) })),
      postTreasury: (projectId, key) => {
        setState((current) => {
          const project = current.projects.find((item) => item.id === projectId);
          if (!project) return current;
          const draft = treasuryDraft(project.treasury, key);
          if (!draft) return current;
          return {
            ...current,
            projects: current.projects.map((item) => {
              if (item.id !== projectId) return item;
              const items = item.lineItems.slice();
              let index = items.findIndex((line) => line.meta?.treasuryKey === key);
              if (index < 0 && draft.refId) index = items.findIndex((line) => line.refId === draft.refId);
              if (index >= 0) {
                const prev = items[index];
                items[index] = { ...prev, ...draft, id: prev.id, status: prev.status, billing: prev.billing, notes: prev.notes || draft.notes };
                return touch(item, { lineItems: items });
              }
              const line: LineItem = { ...draft, id: uid("line") };
              const checks = draft.source === "service" ? makeChecks(line, current.services, current.packages) : [];
              if (key === "mm-weeks") {
                checks.push({
                  id: `${line.id}-c0`,
                  group: line.name,
                  text: "Weekly MM term confirmed",
                  done: false,
                  critical: false,
                  lineItemId: line.id,
                });
              }
              return touch(item, { lineItems: [...items, line], checks: [...item.checks, ...checks] });
            }),
          };
        });
      },
    };
  }, [state, hydrated]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Store missing");
  return ctx;
}
