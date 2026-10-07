import { balances } from "./calc";
import { KIND_LABEL, type Db, type Tx } from "./types";

// Türkçe Excel: ayraç ";" ve ondalık "," bekler; nokta ondalıklı sayılar metin sayılır.
const SEP = ";";

const quote = (s: string) => (/[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
/** "=", "+", "-", "@" ile başlayan metin Excel'de formül sayılmasın diye başına ' konur. */
const cell = (v: string | null) => (v == null ? "" : quote(/^[=+\-@\t\r]/.test(v) ? `'${v}` : v));
const num = (n: number) => n.toFixed(2).replace(".", ",");
const line = (cols: string[]) => cols.join(SEP);

/** Başlık satırı Excel'deki sütunlarla aynı (Tutar, Nereden, Nereye, Tarih, Pcn); boş taraf boş hücre. */
export function transactionsCsv(txs: Tx[]): string {
  const rows = [...txs].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  return [
    line(["Tutar", "Nereden", "Nereye", "Tarih", "Pcn", "Ödendi"]),
    ...rows.map((t) => line([num(t.amount), cell(t.from), cell(t.to), t.date, t.currency, t.settled ? "evet" : "hayır"])),
  ].join("\r\n") + "\r\n";
}

export function sourcesCsv(db: Db, today: string): string {
  return [
    line(["Kaynak", "Tür", "Para birimi", "Bakiye (bugüne kadar)"]),
    ...balances(db, today).map((s) => line([cell(s.name), KIND_LABEL[s.kind], s.currency, num(s.balance)])),
  ].join("\r\n") + "\r\n";
}
