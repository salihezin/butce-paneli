import { Section, Empty } from "@/components/Cards";
import { KkRow } from "@/components/Forms";
import { keyOf } from "@/lib/calc";
import { fmtDate, todayISO } from "@/lib/dates";
import { money } from "@/lib/format";
import { readDb } from "@/lib/store";
import { VB_KK_PREFIX } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function VakifbankCard() {
  const today = todayISO();
  const db = await readDb();
  const rows = db.transactions
    .filter((t) => t.from && !t.to && t.date > today && keyOf(t.from).startsWith(keyOf(VB_KK_PREFIX)))
    .sort((a, b) => a.date.localeCompare(b.date));

  const byDate = new Map<string, typeof rows>();
  for (const r of rows) byDate.set(r.date, [...(byDate.get(r.date) ?? []), r]);

  return (
    <Section
      title="Vakıfbank kredi kartı"
      hint="İleri tarihli kayıtlar: gelecek taksitler ve bu dönemin harcamaları. Tutarı ya da tarihi buradan düzelt, tek tek veri girmene gerek yok."
    >
      {rows.length === 0 ? (
        <Empty>İleri tarihli Vakıfbank kredi kartı kaydı yok.</Empty>
      ) : (
        <div className="space-y-4">
          {[...byDate.entries()].map(([date, list]) => (
            <div key={date} className="kart px-5 pb-1 pt-4">
              <h3 className="font-semibold">
                {fmtDate(date)}
                <span className="num ml-3 text-sm font-normal text-sessiz">
                  {list.length > 1 ? `${list.length} kalem, ` : ""}
                  {[...new Set(list.map((l) => l.currency))]
                    .map((c) => money(list.filter((l) => l.currency === c).reduce((s, l) => s + l.amount, 0), c))
                    .join(" + ")}
                </span>
              </h3>
              {list.map((t) => (
                <KkRow key={t.id} id={t.id} name={t.from!} amount={t.amount} date={t.date} currency={t.currency} />
              ))}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
