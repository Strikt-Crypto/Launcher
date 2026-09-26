export function scrub(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(scrub);
  if (!value || typeof value !== "object") {
    if (typeof value === "string" && value.startsWith("data:")) return "";
    return value;
  }
  const next: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === "privateKey") continue;
    next[key] = scrub(item);
  }
  return next;
}
