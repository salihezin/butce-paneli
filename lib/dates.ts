const parts = (iso: string) => iso.split("-").map(Number) as [number, number, number];

/** Bugünün tarihi (İstanbul saati). Test için APP_TODAY=YYYY-MM-DD verilebilir. */
export function todayISO(): string {
  if (process.env.APP_TODAY) return process.env.APP_TODAY;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** 6 Ekim + 1 ay = 6 Kasım. Ay sonu taşmasını (31 → 30) kısar. */
export function addMonths(iso: string, n: number): string {
  const [y, m, d] = parts(iso);
  const first = new Date(Date.UTC(y, m - 1 + n, 1));
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  first.setUTCDate(Math.min(d, lastDay));
  return first.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  const f = (s: string) => {
    const [y, m, d] = parts(s);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((f(b) - f(a)) / 86_400_000);
}

export function isISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

const fmt = (opts: Intl.DateTimeFormatOptions) => (iso: string) => {
  const [y, m, d] = parts(iso);
  return new Intl.DateTimeFormat("tr-TR", { timeZone: "UTC", ...opts }).format(new Date(Date.UTC(y, m - 1, d)));
};

export const fmtDate = fmt({ day: "numeric", month: "long", year: "numeric" });
export const fmtDay = fmt({ day: "numeric" });
export const fmtMonthShort = fmt({ month: "short" });
export const fmtMonthYear = fmt({ month: "long", year: "numeric" });

export function daysLeftLabel(days: number): string {
  if (days <= 0) return "bugün";
  if (days === 1) return "yarın";
  return `${days} gün kaldı`;
}
