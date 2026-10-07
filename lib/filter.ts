import { keyOf } from "./calc";
import type { Tx } from "./types";

export type Zaman = "gecmis" | "gelecek" | "hepsi";
export type Filters = { q: string; kaynak: string; zaman: Zaman; bas: string; bit: string; sayfa: number };

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function parseFilters(sp: Params): Filters {
  const zaman = one(sp.zaman);
  return {
    q: one(sp.q).trim(),
    kaynak: one(sp.kaynak).trim(),
    zaman: zaman === "gelecek" || zaman === "hepsi" ? zaman : "gecmis",
    bas: one(sp.bas),
    bit: one(sp.bit),
    sayfa: Math.max(1, Number.parseInt(one(sp.sayfa), 10) || 1),
  };
}

export function applyFilters(txs: Tx[], f: Filters, today: string): Tx[] {
  const q = f.q ? keyOf(f.q) : "";
  // "4.965,10" ve "4965,10" → "4965.10"; virgül yoksa olduğu gibi (ör. "5250").
  const amountQ = f.q.includes(",") ? f.q.replace(/\./g, "").replace(",", ".") : f.q;
  const k = f.kaynak ? keyOf(f.kaynak) : "";

  return txs.filter((t) => {
    if (f.zaman === "gecmis" && t.date > today) return false;
    if (f.zaman === "gelecek" && t.date <= today) return false;
    if (f.bas && t.date < f.bas) return false;
    if (f.bit && t.date > f.bit) return false;

    const a = t.from ? keyOf(t.from) : "";
    const b = t.to ? keyOf(t.to) : "";
    if (k && a !== k && b !== k) return false;
    if (q && !a.includes(q) && !b.includes(q) && !t.amount.toFixed(2).includes(amountQ) && !String(t.amount).includes(amountQ)) return false;
    return true;
  });
}

/** İleri tarihli listede en yakın vade üstte, diğerlerinde en yeni işlem üstte. */
export function sortTransactions(txs: Tx[], zaman: Zaman): Tx[] {
  const dir = zaman === "gelecek" ? 1 : -1;
  return [...txs].sort((a, b) => dir * a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}
