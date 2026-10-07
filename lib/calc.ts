import { addMonths, daysBetween } from "./dates";
import type { Db, Kind, Tx } from "./types";

/** İsim eşleştirme anahtarı: büyük/küçük harf ve Türkçe İ/ı farkını yok sayar. */
export const keyOf = (s: string) => s.trim().replace(/\s+/g, " ").toLocaleUpperCase("tr-TR");

const cents = (n: number) => Math.round(n * 100);

export type SourceBalance = { id: string; name: string; kind: Kind; currency: string; balance: number };

/** Excel'deki H − I mantığı: gelen − giden. Sadece bugüne kadar olan işlemler sayılır. */
export function balances(db: Db, today: string): SourceBalance[] {
  const sum = new Map<string, number>();
  const add = (name: string, c: number) => sum.set(keyOf(name), (sum.get(keyOf(name)) ?? 0) + c);
  for (const t of db.transactions) {
    if (t.date > today) continue;
    if (t.to) add(t.to, cents(t.amount));
    if (t.from) add(t.from, -cents(t.amount));
  }
  return db.sources.map((s) => ({ ...s, balance: (sum.get(keyOf(s.name)) ?? 0) / 100 }));
}

export type DueItem = {
  key: string;
  name: string;
  date: string;
  currency: string;
  total: number;
  count: number;
  daysLeft: number;
  ids: string[]; // karttaki satırlar ("ödendi" için)
};

/** Aynı kişi/kurum + aynı gün + aynı para birimi tek kartta toplanır. */
function groupByDate(txs: Tx[], pick: (t: Tx) => string, today: string): DueItem[] {
  const map = new Map<string, DueItem & { c: number }>();
  for (const t of txs) {
    const name = pick(t);
    const k = `${keyOf(name)}|${t.date}|${t.currency}`;
    const cur = map.get(k) ?? { key: k, name, date: t.date, currency: t.currency, total: 0, count: 0, daysLeft: daysBetween(today, t.date), ids: [], c: 0 };
    cur.c += cents(t.amount);
    cur.count += 1;
    cur.ids.push(t.id);
    cur.total = cur.c / 100;
    map.set(k, cur);
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name, "tr"));
}

export type StandardItem = {
  key: string;
  name: string;
  currency: string;
  count: number;
  total: number;
  nextDate: string;
  nextAmount: number;
  lastDate: string;
};

function groupByPayee(txs: Tx[]): StandardItem[] {
  const map = new Map<string, Tx[]>();
  for (const t of txs) {
    const k = `${keyOf(t.from!)}|${t.currency}`;
    map.set(k, [...(map.get(k) ?? []), t]);
  }
  return [...map.entries()]
    .map(([key, list]) => {
      const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
      const nextDate = sorted[0].date;
      return {
        key,
        name: sorted[0].from!,
        currency: sorted[0].currency,
        count: sorted.length,
        total: sorted.reduce((s, t) => s + cents(t.amount), 0) / 100,
        nextDate,
        nextAmount: sorted.filter((t) => t.date === nextDate).reduce((s, t) => s + cents(t.amount), 0) / 100,
        lastDate: sorted[sorted.length - 1].date,
      };
    })
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate) || a.name.localeCompare(b.name, "tr"));
}

export type Summary = {
  dueTL: number;
  otherDue: { currency: string; total: number }[]; // TL dışı: çevrilmez, ayrıca listelenir
  availableTL: number;
  diffTL: number; // available − due (eksi = yetmiyor)
};

/** Önümüzdeki bir ayda ödenecekler ile TL hesapların net toplamı (ekside kalan hesap toplamdan düşer). */
export function summarize(upcoming: DueItem[], accounts: { currency: string; balance: number }[]): Summary | null {
  if (upcoming.length === 0) return null;
  const sum = (xs: number[]) => xs.reduce((s, x) => s + cents(x), 0) / 100;
  const dueTL = sum(upcoming.filter((u) => u.currency === "TL").map((u) => u.total));
  const others = new Map<string, number[]>();
  for (const u of upcoming) if (u.currency !== "TL") others.set(u.currency, [...(others.get(u.currency) ?? []), u.total]);
  const availableTL = sum(accounts.filter((a) => a.currency === "TL").map((a) => a.balance));
  return {
    dueTL,
    otherDue: [...others.entries()].map(([currency, totals]) => ({ currency, total: sum(totals) })),
    availableTL,
    diffTL: Math.round((availableTL - dueTL) * 100) / 100,
  };
}

export function dashboard(db: Db, today: string) {
  const bal = balances(db, today);
  const kindOf = new Map(db.sources.map((s) => [keyOf(s.name), s.kind]));
  const isAccount = (name: string) => kindOf.get(keyOf(name)) === "hesap";

  const windowEnd = addMonths(today, 1);
  const future = db.transactions.filter((t) => t.date > today);

  // Ödeme yükümlülüğü: ileri tarihli, "Nereden" dolu, "Nereye" boş, Nereden bir hesabımız değil ve henüz "ödendi" işaretlenmemiş.
  const obligations = future.filter((t) => t.from && !t.to && !isAccount(t.from) && !t.settled);
  // Alacak: ileri tarihli, "Nereye" dolu (hesabımız değil), "Nereden" boş.
  const incoming = future.filter((t) => t.to && !t.from && !isAccount(t.to));

  const assets = bal.filter((s) => s.kind === "hesap" && s.balance > 0).sort((a, b) => b.balance - a.balance);
  const upcoming = groupByDate(obligations.filter((t) => t.date <= windowEnd), (t) => t.from!, today);

  return {
    today,
    windowEnd,
    assets,
    summary: summarize(upcoming, bal.filter((s) => s.kind === "hesap")),
    payAccounts: bal.filter((s) => s.kind === "hesap").map((s) => ({ name: s.name, currency: s.currency })),
    debts: bal.filter((s) => s.kind !== "hesap" && s.balance < 0).map((s) => ({ ...s, owed: -s.balance })),
    upcoming,
    standard: groupByPayee(obligations.filter((t) => t.date > windowEnd)),
    receivables: groupByDate(incoming, (t) => t.to!, today),
  };
}
