import type { Currency } from "../types";

export function formatCompactUsd(amount: number) {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  const units: [number, string][] = [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
  for (const [size, suffix] of units) {
    if (abs >= size) {
      const value = abs / size;
      const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2;
      return `${sign}$${value.toFixed(digits)}${suffix}`;
    }
  }
  return formatUsd(amount);
}

export function formatPct(amount: number) {
  const sign = amount > 0 ? "+" : "";
  return `${sign}${amount.toLocaleString("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`;
}

export function formatUsd(amount: number) {
  const whole = Math.abs(amount - Math.round(amount)) < 0.001;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: whole ? 0 : 2,
  }).format(amount);
}

export function formatEur(amount: number) {
  const whole = Math.abs(amount - Math.round(amount)) < 0.001;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: whole ? 0 : 2,
  }).format(amount);
}

export function formatEth(amount: number) {
  const text = amount.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return `${text} ETH`;
}

export function money(amount: number, currency: Currency) {
  if (currency === "ETH") return formatEth(amount);
  if (currency === "EUR") return formatEur(amount);
  return formatUsd(amount);
}

export function shortAddress(value: string) {
  const clean = value.trim();
  if (!clean) return "—";
  if (clean.length <= 16) return clean;
  return `${clean.slice(0, 6)}…${clean.slice(-4)}`;
}

export function tickerOf(ticker: string) {
  const clean = ticker.trim();
  if (!clean) return "—";
  return clean.startsWith("$") ? clean : `$${clean}`;
}

export function formatDay(value: string) {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function formatLong(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

export function href(url: string) {
  const clean = url.trim();
  if (!clean) return "";
  if (/^(https?:|mailto:)/i.test(clean)) return clean;
  if (clean.includes("@") && !clean.includes("/")) return `mailto:${clean}`;
  return `https://${clean}`;
}

export function byId<T extends { id: string }>(list: T[], id?: string) {
  if (!id) return undefined;
  return list.find((item) => item.id === id);
}

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
