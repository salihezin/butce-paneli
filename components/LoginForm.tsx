"use client";

import { useActionState } from "react";
import { signIn, type AuthState } from "@/app/auth-actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, {});
  return (
    <form action={action} className="kart mx-auto mt-10 grid max-w-sm gap-4 p-6">
      <h1 className="text-xl font-semibold tracking-tight">Giriş yap</h1>
      <div>
        <label htmlFor="email" className="etiket">E-posta</label>
        <input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.email} className="alan" />
      </div>
      <div>
        <label htmlFor="password" className="etiket">Şifre</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="alan" />
      </div>
      <div aria-live="polite" className="min-h-5 text-sm font-medium text-nar">{state.error}</div>
      <button className="dugme" disabled={pending}>{pending ? "Giriş yapılıyor…" : "Giriş yap"}</button>
    </form>
  );
}
