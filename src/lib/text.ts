import type { IncludeItem, LinkItem, Outlet, Requirement } from "../types";

export function linesOf(text: string) {
  return text.split("\n").map((line) => line.trim()).filter(Boolean);
}

export function requirementsToText(items: Requirement[]) {
  return items.map((item) => (item.critical ? `! ${item.text}` : item.text)).join("\n");
}

export function parseRequirements(text: string): Requirement[] {
  return linesOf(text).map((line, index) => {
    const critical = line.startsWith("!");
    return {
      id: `req-${index}`,
      text: critical ? line.slice(1).trim() : line,
      critical,
    };
  });
}

export function includesToText(items: IncludeItem[]) {
  return items
    .map((item) => [item.label, item.url, item.note].filter(Boolean).join(" | "))
    .join("\n");
}

export function parseIncludes(text: string): IncludeItem[] {
  return linesOf(text).map((line) => {
    const [label, url, note] = line.split("|").map((part) => part.trim());
    return { label, url: url || undefined, note: note || undefined };
  });
}

export function outletsToText(items: Outlet[]) {
  return items.map((item) => {
    const extra = (item.links || []).map((link) => `${link.label}=${link.url}`).join("; ");
    return [item.name, item.url || "", item.note || "", item.group || "", extra].join(" | ").replace(/(?: \| )+$/, "");
  }).join("\n");
}

export function parseOutlets(text: string): Outlet[] {
  return linesOf(text).map((line) => {
    const [name, url, note, group, extra] = line.split("|").map((part) => part.trim());
    const links = (extra || "").split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
      const split = part.indexOf("=");
      return split === -1 ? { label: "Link", url: part } : { label: part.slice(0, split).trim(), url: part.slice(split + 1).trim() };
    }).filter((link) => link.url);
    return { name, url: url || undefined, note: note || undefined, group: group || undefined, links: links.length ? links : undefined };
  });
}

export function linksToText(items: LinkItem[]) {
  return items.map((item) => `${item.label} | ${item.url}`).join("\n");
}

export function parseLinks(text: string): LinkItem[] {
  return linesOf(text)
    .map((line) => {
      const [label, url] = line.split("|").map((part) => part.trim());
      return { label, url };
    })
    .filter((item) => item.label && item.url);
}
