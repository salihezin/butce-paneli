"use client";

import { useActionState, useState } from "react";
import { markPaid, type FormState } from "@/app/actions";
import { money } from "@/lib/format";
import { NO_ACCOUNT } from "@/lib/types";

type Account = { name: string; currency: string };

/** Yaklaşan borç kartının altındaki "Ödendi" düğmesi. Hesabı seçince ödeme kaydolur, kart panelden kalkar. */
export default function PayPanel({ ids, payee, amount, currency, accounts }: { ids: string[]; payee: string; amount: number; currency: string; accounts: Account[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(markPaid, {});
  const options = accounts.filter((a) => a.currency === currency);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-3 text-sm font-medium text-cini-koyu underline underline-offset-2">
        Ödendi
      </button>
    );
  }

  return (
    <form action={action} className="mt-3 space-y-2 border-t border-cizgi pt-3">
      {ids.map((id) => (
        <input key={id} type="hidden" name="id" value={id} />
      ))}
      <input type="hidden" name="payee" value={payee} />
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="currency" value={currency} />
      <label htmlFor={`acc-${ids[0]}`} className="etiket">
        Hangi hesaptan ödendi? ({money(amount, currency)})
      </label>
      <select id={`acc-${ids[0]}`} name="account" required defaultValue="" className="alan">
        <option value="" disabled>Hesap seç</option>
        {options.map((a) => (
          <option key={a.name} value={a.name}>{a.name}</option>
        ))}
        <option value={NO_ACCOUNT}>Hesaptan düşme, sadece kapat</option>
      </select>
      {options.length === 0 && <p className="text-xs text-sessiz">{currency} cinsinden hesap yok; ödemeyi hesaplara yansıtmadan kapatabilirsin.</p>}
      <div className="flex items-center gap-2">
        <button className="dugme" disabled={pending}>{pending ? "Kaydediliyor…" : "Ödendi olarak kaydet"}</button>
        <button type="button" className="dugme-ikincil" onClick={() => setOpen(false)}>Vazgeç</button>
      </div>
      <p aria-live="polite" className="min-h-4 text-sm font-medium text-nar">{state.error}</p>
    </form>
  );
}
