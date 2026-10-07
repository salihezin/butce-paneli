"use client";

import { useActionState, useEffect, useState } from "react";
import { deleteTransaction, updateTransactionFull, type FormState } from "@/app/actions";
import { fmtDate } from "@/lib/dates";
import { money } from "@/lib/format";
import { CURRENCIES, type Tx } from "@/lib/types";

/** İşlem satırı. Düzenle'ye basınca yerinde forma dönüşür. Nereden/Nereye önerileri sayfadaki #kaynaklar listesinden gelir. */
export default function TxRow({ tx, future }: { tx: Tx; future: boolean }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(updateTransactionFull, {});

  useEffect(() => {
    if (state.ok) setEditing(false);
  }, [state.ok, state.nonce]);

  if (!editing) {
    return (
      <li className="grid items-center gap-x-4 gap-y-1 border-t border-cizgi px-4 py-3 first:border-t-0 sm:grid-cols-[10rem_minmax(0,1fr)_auto_auto]">
        <span className="text-sm text-sessiz">
          {fmtDate(tx.date)}
          {future && <span className="ml-2 rounded bg-kehribar-acik px-1.5 py-0.5 text-xs font-medium text-kehribar">ileri tarihli</span>}
        </span>
        <span className="min-w-0 truncate">
          {tx.from ?? "—"} <span aria-hidden className="text-sessiz">→</span> {tx.to ?? "—"}
        </span>
        <span className="num font-medium sm:text-right">{money(tx.amount, tx.currency)}</span>
        <button className="dugme-ikincil justify-self-start" onClick={() => setEditing(true)} aria-label={`${tx.from ?? "—"} → ${tx.to ?? "—"} işlemini düzenle`}>
          Düzenle
        </button>
      </li>
    );
  }

  return (
    <li className="border-t border-cizgi bg-zemin/60 px-4 py-4 first:border-t-0">
      <form action={action} className="grid gap-3 sm:grid-cols-6">
        <input type="hidden" name="id" value={tx.id} />
        <div className="sm:col-span-2">
          <label htmlFor={`f-${tx.id}`} className="etiket">Nereden</label>
          <input id={`f-${tx.id}`} name="from" list="kaynaklar" autoComplete="off" defaultValue={tx.from ?? ""} className="alan" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`t-${tx.id}`} className="etiket">Nereye</label>
          <input id={`t-${tx.id}`} name="to" list="kaynaklar" autoComplete="off" defaultValue={tx.to ?? ""} className="alan" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`d-${tx.id}`} className="etiket">Tarih</label>
          <input id={`d-${tx.id}`} name="date" type="date" required defaultValue={tx.date} className="alan" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`a-${tx.id}`} className="etiket">Tutar</label>
          <input id={`a-${tx.id}`} name="amount" type="number" step="0.01" min="0" inputMode="decimal" required defaultValue={tx.amount} className="alan num" />
        </div>
        <div>
          <label htmlFor={`c-${tx.id}`} className="etiket">Para birimi</label>
          <select id={`c-${tx.id}`} name="currency" defaultValue={tx.currency} className="alan">
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2 sm:col-span-3">
          <button className="dugme" disabled={pending}>{pending ? "Kaydediliyor…" : "Kaydet"}</button>
          <button type="button" className="dugme-ikincil" onClick={() => setEditing(false)}>Vazgeç</button>
        </div>
        <p aria-live="polite" className="min-h-5 text-sm font-medium text-nar sm:col-span-6">{state.error}</p>
      </form>
      <form
        action={deleteTransaction}
        onSubmit={(e) => {
          if (!confirm("Bu işlem silinsin mi?")) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={tx.id} />
        <button className="text-sm font-medium text-nar underline-offset-2 hover:underline">İşlemi sil</button>
      </form>
    </li>
  );
}
