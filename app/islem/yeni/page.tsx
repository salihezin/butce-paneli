import Link from "next/link";
import { Empty, Section } from "@/components/Cards";
import RecurringForm from "@/components/RecurringForm";
import { TransactionForm } from "@/components/Forms";
import { fmtDate, todayISO } from "@/lib/dates";
import { money } from "@/lib/format";
import { readDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function NewTransaction() {
  const db = await readDb();
  const names = [...new Set([...db.sources.map((s) => s.name), ...db.transactions.flatMap((t) => [t.from, t.to])])]
    .filter((n): n is string => !!n)
    .sort((a, b) => a.localeCompare(b, "tr"));
  const recent = db.transactions
    .filter((t) => t.createdAt)
    .sort((a, b) => b.createdAt!.localeCompare(a.createdAt!))
    .slice(0, 8);

  return (
    <>
      <Section title="İşlem ekle" hint="Excel'deki satırlarla aynı alanlar. İsimler önerilir, listede olmayan bir isim de yazabilirsin.">
        <TransactionForm names={names} defaultDate={todayISO()} />
      </Section>

      <Section title="Tekrarlayan ödeme ekle" hint="Kredi, aidat, taksit gibi aylık ödemeleri tek seferde üretir. Kaydetmeden önce oluşacak satırları görürsün.">
        <RecurringForm names={names} defaultDate={todayISO()} />
      </Section>

      <Section title="Son eklenenler">
        {recent.length === 0 ? (
          <Empty>Buradan eklediğin işlemler burada listelenir.</Empty>
        ) : (
        <div className="kart overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="border-b border-cizgi text-sessiz">
              <tr>
                <th className="px-4 py-2 font-medium">Tarih</th>
                <th className="px-4 py-2 font-medium">Nereden</th>
                <th className="px-4 py-2 font-medium">Nereye</th>
                <th className="px-4 py-2 text-right font-medium">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => (
                <tr key={t.id} className="border-t border-cizgi first:border-t-0">
                  <td className="px-4 py-2">{fmtDate(t.date)}</td>
                  <td className="px-4 py-2">{t.from ?? "—"}</td>
                  <td className="px-4 py-2">{t.to ?? "—"}</td>
                  <td className="num px-4 py-2 text-right">{money(t.amount, t.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
        <p className="mt-3 text-sm">
          <Link href="/islemler" className="font-medium text-cini-koyu underline underline-offset-2">Tüm işlemleri gör, düzenle ya da sil</Link>
        </p>
      </Section>
    </>
  );
}
