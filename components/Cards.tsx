import { daysLeftLabel, fmtDate, fmtDay, fmtMonthShort, fmtMonthYear } from "@/lib/dates";
import { money } from "@/lib/format";
import type { DueItem, StandardItem, Summary as SummaryData } from "@/lib/calc";
import PayPanel from "./PayPanel";

export function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {hint && <p className="mb-4 mt-0.5 max-w-prose text-sm text-sessiz">{hint}</p>}
      {!hint && <div className="mb-4" />}
      {children}
    </section>
  );
}

export function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="kart border-dashed px-4 py-5 text-[15px] text-sessiz">{children}</p>;
}

export function BalanceCard({ name, amount, currency, tone = "normal" }: { name: string; amount: number; currency: string; tone?: "normal" | "borc" }) {
  return (
    <div className={`kart p-4 ${tone === "borc" ? "border-nar/40 bg-nar-acik/40" : ""}`}>
      <p className="truncate text-sm text-sessiz">{name}</p>
      <p className={`num mt-1 text-2xl font-semibold ${tone === "borc" ? "text-nar" : ""}`}>{money(amount, currency)}</p>
    </div>
  );
}

/** Tarih "koçan"ı: yaklaşan ödeme ve alacak kartlarının ortak yüzü. */
export function DueCard({ item, tone, accounts }: { item: DueItem; tone: "borc" | "alacak"; accounts?: { name: string; currency: string }[] }) {
  const stub = tone === "borc" ? "bg-kehribar-acik text-kehribar" : "bg-cini-acik text-cini-koyu";
  return (
    <div className="kart flex overflow-hidden">
      <div className={`flex w-[72px] shrink-0 flex-col items-center justify-center py-3 ${stub}`}>
        <span className="num text-3xl font-semibold leading-none">{fmtDay(item.date)}</span>
        <span className="mt-1 text-sm font-medium">{fmtMonthShort(item.date)}</span>
      </div>
      <div className="min-w-0 flex-1 p-4">
        <p className="truncate text-sm text-sessiz">{item.name}</p>
        <p className="num mt-0.5 text-xl font-semibold">{money(item.total, item.currency)}</p>
        <p className="mt-1 text-sm text-sessiz">
          {daysLeftLabel(item.daysLeft)}
          {item.count > 1 ? `, ${item.count} kalem` : ""}
        </p>
        {tone === "borc" && accounts && (
          <PayPanel ids={item.ids} payee={item.name} amount={item.total} currency={item.currency} accounts={accounts} />
        )}
      </div>
    </div>
  );
}

export function StandardCard({ item }: { item: StandardItem }) {
  return (
    <div className="kart p-4">
      <p className="truncate text-sm text-sessiz">{item.name}</p>
      <p className="num mt-0.5 text-xl font-semibold">{money(item.total, item.currency)}</p>
      <p className="mt-0.5 text-sm text-sessiz">{item.count === 1 ? "1 ödeme kaldı" : `${item.count} ödeme kaldı`}</p>
      <dl className="mt-3 space-y-1 border-t border-cizgi pt-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-sessiz">Sıradaki</dt>
          <dd className="num text-right">
            {fmtDate(item.nextDate)} · {money(item.nextAmount, item.currency)}
          </dd>
        </div>
        {item.count > 1 && (
          <div className="flex justify-between gap-3">
            <dt className="text-sessiz">Son ödeme</dt>
            <dd className="text-right">{fmtMonthYear(item.lastDate)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

/** "Bir ayda ödenecek / hesaplarında var / geriye kalan" özeti. TL dışı tutarlar çevrilmeden ayrıca yazılır. */
export function SummaryBar({ s }: { s: SummaryData }) {
  const enough = s.diffTL >= 0;
  const others = s.otherDue.map((o) => money(o.total, o.currency)).join(" + ");
  return (
    <p className={`mb-4 rounded-md border px-4 py-3 text-[15px] ${enough ? "border-cini/30 bg-cini-acik/60" : "border-nar/40 bg-nar-acik/60"}`}>
      Bir ay içinde ödenecek <strong className="num">{money(s.dueTL)}</strong>
      {others && <> (ayrıca <span className="num">{others}</span>)</>}. Hesaplarında <span className="num">{money(s.availableTL)}</span> var;{" "}
      {enough ? (
        <>ödemelerden sonra <strong className="num text-cini-koyu">{money(s.diffTL)}</strong> kalır.</>
      ) : (
        <>
          <strong className="num text-nar">{money(-s.diffTL)}</strong> eksik.
        </>
      )}
    </p>
  );
}
