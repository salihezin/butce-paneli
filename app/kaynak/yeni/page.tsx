import { Section } from "@/components/Cards";
import { SourceForm } from "@/components/Forms";
import { balances } from "@/lib/calc";
import { todayISO } from "@/lib/dates";
import { money } from "@/lib/format";
import { readDb } from "@/lib/store";
import { KIND_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewSource() {
  const rows = balances(await readDb(), todayISO());
  return (
    <>
      <Section title="Kaynak ekle" hint="Bakiyesi takip edilecek hesap, kişi ya da borç. Excel'de G sütununa yazdığın isimler buraya girilir.">
        <SourceForm />
      </Section>

      <Section title="Kayıtlı kaynaklar">
        <div className="kart overflow-x-auto">
          <table className="w-full min-w-[30rem] text-left text-sm">
            <thead className="border-b border-cizgi text-sessiz">
              <tr>
                <th className="px-4 py-2 font-medium">Kaynak</th>
                <th className="px-4 py-2 font-medium">Türü</th>
                <th className="px-4 py-2 text-right font-medium">Bakiye</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-t border-cizgi first:border-t-0">
                  <td className="px-4 py-2">{s.name}</td>
                  <td className="px-4 py-2 text-sessiz">{KIND_LABEL[s.kind]}</td>
                  <td className={`num px-4 py-2 text-right ${s.balance < 0 ? "text-nar" : ""}`}>{money(s.balance, s.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
