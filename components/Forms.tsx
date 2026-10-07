"use client";

import { useActionState } from "react";
import { addSource, addTransaction, deleteTransaction, updateTransaction, type FormState } from "@/app/actions";
import { CURRENCIES, KIND_LABEL } from "@/lib/types";

function Status({ state }: { state: FormState }) {
  return (
    <div aria-live="polite" className="min-h-6 text-sm">
      {state.error && <p className="font-medium text-nar">{state.error}</p>}
      {state.ok && state.message && <p className="font-medium text-cini-koyu">{state.message}</p>}
    </div>
  );
}

function CurrencySelect({ defaultValue }: { defaultValue?: string }) {
  return (
    <select name="currency" className="alan" defaultValue={defaultValue ?? "TL"}>
      {CURRENCIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}

export function TransactionForm({ names, defaultDate }: { names: string[]; defaultDate: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addTransaction, {});
  const v = state.values ?? {};
  return (
    <form action={action} className="kart grid gap-4 p-5 sm:grid-cols-2">
      <div>
        <label htmlFor="amount" className="etiket">Tutar</label>
        <input id="amount" name="amount" type="number" step="0.01" min="0" inputMode="decimal" required defaultValue={v.amount} className="alan num" />
      </div>
      <div>
        <label htmlFor="currency" className="etiket">Para birimi</label>
        <CurrencySelect defaultValue={v.currency} />
      </div>
      <div>
        <label htmlFor="from" className="etiket">Nereden</label>
        <input id="from" name="from" list="kaynaklar" autoComplete="off" defaultValue={v.from} className="alan" />
      </div>
      <div>
        <label htmlFor="to" className="etiket">Nereye</label>
        <input id="to" name="to" list="kaynaklar" autoComplete="off" defaultValue={v.to} className="alan" />
      </div>
      <datalist id="kaynaklar">
        {names.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <div>
        <label htmlFor="date" className="etiket">Tarih</label>
        <input id="date" name="date" type="date" required defaultValue={v.date ?? defaultDate} className="alan" />
      </div>
      <p className="self-end text-sm text-sessiz">Para dışarıdan geliyorsa Nereden'i, dışarıya gidiyorsa Nereye'yi boş bırak.</p>
      <div className="flex items-center gap-4 sm:col-span-2">
        <button className="dugme" disabled={pending}>{pending ? "Kaydediliyor…" : "İşlemi kaydet"}</button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function SourceForm({ defaultCurrency }: { defaultCurrency?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addSource, {});
  const v = state.values ?? {};
  return (
    <form action={action} className="kart grid gap-4 p-5 sm:grid-cols-3">
      <div className="sm:col-span-3">
        <label htmlFor="name" className="etiket">Kaynak adı</label>
        <input id="name" name="name" required autoComplete="off" defaultValue={v.name} className="alan" />
      </div>
      <div>
        <label htmlFor="kind" className="etiket">Türü</label>
        <select id="kind" name="kind" className="alan" defaultValue={v.kind ?? "hesap"}>
          {Object.entries(KIND_LABEL).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="currency" className="etiket">Para birimi</label>
        <CurrencySelect defaultValue={v.currency ?? defaultCurrency} />
      </div>
      <div className="flex items-center gap-4 sm:col-span-3">
        <button className="dugme" disabled={pending}>{pending ? "Ekleniyor…" : "Kaynağı ekle"}</button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function KkRow({ id, name, amount, date, currency }: { id: string; name: string; amount: number; date: string; currency: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateTransaction, {});
  return (
    <div className="flex flex-wrap items-end gap-3 border-t border-cizgi py-3 first:border-t-0">
      <form action={action} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="id" value={id} />
        <div className="w-28">
          <label htmlFor={`a-${id}`} className="etiket">Tutar ({currency})</label>
          <input id={`a-${id}`} name="amount" type="number" step="0.01" min="0" inputMode="decimal" defaultValue={amount} className="alan num" />
        </div>
        <div>
          <label htmlFor={`d-${id}`} className="etiket">Tarih</label>
          <input id={`d-${id}`} name="date" type="date" defaultValue={date} className="alan" />
        </div>
        <button className="dugme-ikincil" disabled={pending}>{pending ? "…" : "Güncelle"}</button>
        <span aria-live="polite" className={`min-w-20 pb-2 text-sm ${state.error ? "text-nar" : "text-cini-koyu"}`}>
          {state.error ?? (state.ok ? "Güncellendi" : "")}
        </span>
      </form>
      <form
        action={deleteTransaction}
        onSubmit={(e) => {
          if (!confirm(`${name} kaydı silinsin mi?`)) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button className="pb-2 text-sm font-medium text-nar underline-offset-2 hover:underline">Sil</button>
      </form>
    </div>
  );
}
