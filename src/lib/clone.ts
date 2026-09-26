import { nowIso, uid } from "./id";
import type { Project } from "../types";

export function cloneProject(project: Project): Project {
  const copy: Project = structuredClone(project);
  copy.id = uid("proj");
  copy.name = `${project.name} copy`;
  copy.sample = false;
  copy.status = "draft";
  copy.createdAt = nowIso();
  copy.updatedAt = nowIso();
  const ids = new Map<string, string>();
  copy.lineItems = copy.lineItems.map((line) => {
    const id = uid("line");
    ids.set(line.id, id);
    return { ...line, id };
  });
  copy.checks = copy.checks.map((check) => ({
    ...check,
    id: uid("chk"),
    lineItemId: check.lineItemId ? ids.get(check.lineItemId) : undefined,
  }));
  copy.wallets = copy.wallets.map((wallet) => ({ ...wallet, id: uid("wal") }));
  copy.socials = (copy.socials || []).map((social) => ({ ...social, id: uid("soc") }));
  copy.logoPacks = (copy.logoPacks || []).map((pack) => ({ ...pack, id: uid("pack"), files: (pack.files || []).map((file) => ({ ...file, id: uid("file") })) }));
  copy.bannerPacks = (copy.bannerPacks || []).map((pack) => ({ ...pack, id: uid("pack"), files: (pack.files || []).map((file) => ({ ...file, id: uid("file") })) }));
  return copy;
}
