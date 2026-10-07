import Link from "next/link";
import { Empty, Section } from "@/components/Cards";
import TxRow from "@/components/TxRow";
import { applyFilters, parseFilters, sortTransactions } from "@/lib/filter";
import { todayISO } from "@/lib/dates";
import { readDb } from "@/lib/store";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;

export default async function Transactions({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const f = parseFilters(await searchParams);
  const today = todayISO();
  const db = await readDb();

  const names = [...new Set([...db.sources.map((s) => s.name), ...db.transactions.flatMap((t) => [t.from, t.to])])]
    .filter((n): n is string => !!n)
    .sort((a, b) => a.localeCompare(b, "tr"));

  const rows = sortTransactions(applyFilters(db.transactions, f, today), f.zaman);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(f.sayfa, pages);
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const href = (p: number) => {
    const qs = new URLSearchParams();
    if (f.q) qs.set("q", f.q);
    if (f.kaynak) qs.set("kaynak", f.kaynak);
    if (f.zaman !== "gecmis") qs.set("zaman", f.zaman);
    if (f.bas) qs.set("bas", f.bas);
    if (f.bit) qs.set("bit", f.bit);
    if (p > 1) qs.set("sayfa", String(p));
    const s = qs.toString();
    return s ? `/islemler?${s}` : "/islemler";
  };

  return (
    <Section title="İşlemler" hint="Arayıp filtrele, bir satırı düzenle ya da sil. Panel bu değişikliklere göre hemen güncellenir.">
      <datalist id="kaynaklar">
        {names.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <form action="/islemler" className="kart mb-4 grid gap-3 p-4 sm:grid-cols-6">
        <div className="sm:col-span-2">
          <label htmlFor="q" className="etiket">Ara</label>
          <input id="q" name="q" defaultValue={f.q} placeholder="isim ya da tutar" className="alan" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="kaynak" className="etiket">Kaynak</label>
          <select id="kaynak" name="kaynak" defaultValue={f.kaynak} className="alan">
            <option value="">Hepsi</option>
            {names.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="zaman" className="etiket">Zaman</label>
          <select id="zaman" name="zaman" defaultValue={f.zaman} className="alan">
            <option value="gecmis">Bugüne kadar</option>
            <option value="gelecek">İleri tarihli</option>
            <option value="hepsi">Hepsi</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="bas" className="etiket">Başlangıç tarihi</label>
          <input id="bas" name="bas" type="date" defaultValue={f.bas} className="alan" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="bit" className="etiket">Bitiş tarihi</label>
          <input id="bit" name="bit" type="date" defaultValue={f.bit} className="alan" />
        </div>
        <div className="flex items-end gap-2 sm:col-span-2">
          <button className="dugme">Filtrele</button>
          <Link href="/islemler" className="dugme-ikincil">Temizle</Link>
        </div>
      </form>

      <p className="mb-2 text-sm text-sessiz">
        {rows.length} işlem{pages > 1 ? ` · sayfa ${page}/${pages}` : ""}
      </p>

      {visible.length === 0 ? (
        <Empty>Bu filtreyle eşleşen işlem yok.</Empty>
      ) : (
        <ul className="kart overflow-hidden">
          {visible.map((t) => (
            <TxRow key={t.id} tx={t} future={t.date > today} />
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav className="mt-4 flex items-center justify-between" aria-label="Sayfalar">
          {page > 1 ? <Link href={href(page - 1)} className="dugme-ikincil">← Önceki</Link> : <span />}
          {page < pages ? <Link href={href(page + 1)} className="dugme-ikincil">Sonraki →</Link> : <span />}
        </nav>
      )}
    </Section>
  );
}
