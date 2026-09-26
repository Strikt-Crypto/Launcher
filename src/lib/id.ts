export function uid(prefix: string) {
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  return `${prefix}-${rand}`;
}

export function nowIso() {
  return new Date().toISOString();
}
