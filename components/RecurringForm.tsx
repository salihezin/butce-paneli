"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { addRecurring, type FormState } from "@/app/actions";
import { fmtDate } from "@/lib/dates";
import { money } from "@/lib/format";
import { buildSchedule, validateRecurring } from "@/lib/recurring";
import { CURRENCIES } from "@/lib/types";

const num = (s: string) => (s.trim() === "" ? NaN : Number(s.replace(",", ".")));

export default function RecurringForm({ names, defaultDate }: { names: string[]; defaultDate: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addRecurring, {});
  const v = state.values ?? {};

  const [from, setFrom] = useState(v.from ?? "");
  const [to, setTo] = useState(v.to ?? "");
  const [amount, setAmount] = useState(v.amount ?? "");
  const [step, setStep] = useState(v.step ?? "");
  const [stepFrom, setStepFrom] = useState(v.stepFrom ?? "");
  const [count, setCount] = useState(v.count ?? "");
  const [date, setDate] = useState(v.date ?? defaultDate);
  const [currency, setCurrency] = useState(v.currency ?? "TL");

  // Başarılı kayıttan sonra formu boşalt (para birimi ve tarih kalır).
  useEffect(() => {
    if (state.ok) {
      setFrom(""); setTo(""); setAmount(""); setStep(""); setStepFrom(""); setCount("");
    }
  }, [state.ok, state.nonce]);

  const preview = useMemo(() => {
    const input = { amount: num(amount), step: step.trim() ? num(step) : 0, stepFrom: stepFrom.trim() ? num(stepFrom) : 2, count: num(count), firstDate: date };
    const problem = validateRecurring(input);
    if (problem) return { problem } as const;
    const rows = buildSchedule(input);
    const total = rows.reduce((s, r) => s + Math.round(r.amount * 100), 0) / 100;
    return { rows, total } as const;
  }, [amount, step, stepFrom, count, date]);

  const empty = amount.trim() === "" && count.trim() === "";

  return (
    <form action={action} className="kart grid gap-4 p-5 sm:grid-cols-2">
      <div>
        <label htmlFor="r-from" className="etiket">Nereden</label>
        <input id="r-from" name="from" list="kaynaklar-tekrar" autoComplete="off" value={from} onChange={(e) => setFrom(e.target.value)} className="alan" />
      </div>
      <div>
        <label htmlFor="r-to" className="etiket">Nereye</label>
        <input id="r-to" name="to" list="kaynaklar-tekrar" autoComplete="off" value={to} onChange={(e) => setTo(e.target.value)} className="alan" />
      </div>
      <datalist id="kaynaklar-tekrar">
        {names.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <div>
        <label htmlFor="r-amount" className="etiket">İlk ödemenin tutarı</label>
        <input id="r-amount" name="amount" type="number" step="0.01" min="0" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="alan num" />
      </div>
      <div>
        <label htmlFor="r-currency" className="etiket">Para birimi</label>
        <select id="r-currency" name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="alan">
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="r-count" className="etiket">Kaç ödeme (aylık)</label>
        <input id="r-count" name="count" type="number" min="2" max="360" step="1" inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} className="alan num" />
      </div>
      <div>
        <label htmlFor="r-date" className="etiket">İlk ödeme tarihi</label>
        <input id="r-date" name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="alan" />
      </div>

      <details className="sm:col-span-2" open={step.trim() !== "" || stepFrom.trim() !== ""}>
        <summary className="cursor-pointer text-sm font-medium text-cini-koyu">Tutar zamanla artıyorsa (isteğe bağlı)</summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="r-step" className="etiket">Her ödemede artış</label>
            <input id="r-step" name="step" type="number" step="0.01" inputMode="decimal" value={step} onChange={(e) => setStep(e.target.value)} className="alan num" />
          </div>
          <div>
            <label htmlFor="r-stepfrom" className="etiket">Artış kaçıncı ödemeden başlasın</label>
            <input id="r-stepfrom" name="stepFrom" type="number" min="2" step="1" inputMode="numeric" placeholder="2" value={stepFrom} onChange={(e) => setStepFrom(e.target.value)} className="alan num" />
          </div>
          <p className="text-sm text-sessiz sm:col-span-2">
            Örnek: 4.965,10 ile başlayıp 3. ödemeden itibaren her ay 1 artsın: ilk iki ödeme 4.965,10, sonra 4.966,10, 4.967,10…
          </p>
        </div>
      </details>

      <div className="rounded-md border border-cizgi bg-zemin/60 p-4 text-sm sm:col-span-2" aria-live="polite">
        {empty ? (
          <p className="text-sessiz">Tutar ve ödeme sayısını girince oluşacak satırlar burada görünür.</p>
        ) : "problem" in preview ? (
          <p className="text-sessiz">{preview.problem}</p>
        ) : (
          <>
            <p className="font-medium">
              {preview.rows.length} ödeme, toplam <span className="num">{money(preview.total, currency)}</span>
            </p>
            <ul className="num mt-2 space-y-0.5 text-sessiz">
              {preview.rows.slice(0, 3).map((r) => (
                <li key={r.date}>{fmtDate(r.date)} · {money(r.amount, currency)}</li>
              ))}
              {preview.rows.length > 4 && <li>…</li>}
              {preview.rows.length > 3 && (
                <li>
                  {fmtDate(preview.rows[preview.rows.length - 1].date)} · {money(preview.rows[preview.rows.length - 1].amount, currency)}
                </li>
              )}
            </ul>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button className="dugme" disabled={pending || empty || "problem" in preview}>
          {pending ? "Ekleniyor…" : "Ödemeleri ekle"}
        </button>
        <div aria-live="polite" className="min-h-6 text-sm">
          {state.error && <p className="font-medium text-nar">{state.error}</p>}
          {state.ok && state.message && <p className="font-medium text-cini-koyu">{state.message}</p>}
        </div>
      </div>
    </form>
  );
}
