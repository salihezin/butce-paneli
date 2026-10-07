import { BalanceCard, DueCard, Empty, Grid, Section, StandardCard } from "@/components/Cards";
import { dashboard } from "@/lib/calc";
import { fmtDate, todayISO } from "@/lib/dates";
import { readDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const today = todayISO();
  const d = dashboard(await readDb(), today);

  return (
    <>
      <p className="mb-6 text-sm text-sessiz">Bugün {fmtDate(today)}</p>

      <Section title="Anlık neyim var?" hint="Bugüne kadar girilen işlemlere göre, bakiyesi olan hesaplar.">
        {d.assets.length === 0 ? (
          <Empty>Şu an bakiyesi olan hesap yok. İşlem ekleyince burada görünür.</Empty>
        ) : (
          <Grid>
            {d.assets.map((a) => (
              <BalanceCard key={a.id} name={a.name} amount={a.balance} currency={a.currency} />
            ))}
          </Grid>
        )}
      </Section>

      <Section title="Kimlere borcum var?">
        {d.debts.length === 0 ? (
          <Empty>Şu an kimseye borcun yok.</Empty>
        ) : (
          <Grid>
            {d.debts.map((s) => (
              <BalanceCard key={s.id} name={s.name} amount={s.owed} currency={s.currency} tone="borc" />
            ))}
          </Grid>
        )}
      </Section>

      <Section title="Yaklaşan borçlarım" hint={`${fmtDate(d.windowEnd)} tarihine kadar, vade sırasıyla.`}>
        {d.upcoming.length === 0 ? (
          <Empty>Önümüzdeki bir ay içinde vadesi gelen borç yok.</Empty>
        ) : (
          <Grid>
            {d.upcoming.map((i) => (
              <DueCard key={i.key} item={i} tone="borc" />
            ))}
          </Grid>
        )}
      </Section>

      <Section title="Standart ödemeler" hint="Yukarıdakilerden sonra kalan ödemeler.">
        {d.standard.length === 0 ? (
          <Empty>Bir aydan sonrasına planlanmış ödeme yok.</Empty>
        ) : (
          <Grid>
            {d.standard.map((i) => (
              <StandardCard key={i.key} item={i} />
            ))}
          </Grid>
        )}
      </Section>

      <Section title="Önümüzdeki alacaklarım">
        {d.receivables.length === 0 ? (
          <Empty>Beklenen alacak yok.</Empty>
        ) : (
          <Grid>
            {d.receivables.map((i) => (
              <DueCard key={i.key} item={i} tone="alacak" />
            ))}
          </Grid>
        )}
      </Section>
    </>
  );
}
