// Supabase veri katmanı. Kullanıcı yetkisi RLS ile veritabanında uygulanır:
// bu fonksiyonlar sadece giriş yapmış kullanıcının evindeki satırları görür/yazar.
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Db, Kind, Source, Tx } from "./types";

const PAGE = 1000; // PostgREST tek istekte en fazla bu kadar satır döndürür
const IMPORTED_BEFORE = "2001-01-01"; // seed.sql created_at = 'epoch' yazar

type TxRow = {
  id: string;
  amount: number | string;
  from_name: string | null;
  to_name: string | null;
  date: string;
  currency: string;
  created_at: string;
};

const fail = (what: string, message: string): never => {
  throw new Error(`${what}: ${message}`);
};

async function client(c?: SupabaseClient) {
  return c ?? (await createClient());
}

export async function readDb(c?: SupabaseClient): Promise<Db> {
  const supabase = await client(c);

  const src = await supabase.from("sources").select("id, name, kind, currency").order("name");
  if (src.error) fail("Kaynaklar okunamadı", src.error.message);

  const rows: TxRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("transactions")
      .select("id, amount, from_name, to_name, date, currency, created_at")
      .order("date")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) fail("İşlemler okunamadı", error.message);
    rows.push(...(data as TxRow[]));
    if (!data || data.length < PAGE) break;
  }

  return {
    sources: (src.data ?? []).map((s) => ({ id: s.id, name: s.name, kind: s.kind as Kind, currency: s.currency })) as Source[],
    transactions: rows.map<Tx>((r) => ({
      id: r.id,
      amount: Number(r.amount),
      from: r.from_name,
      to: r.to_name,
      date: r.date,
      currency: r.currency,
      createdAt: r.created_at > IMPORTED_BEFORE ? r.created_at : undefined,
    })),
  };
}

async function householdId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.from("household_members").select("household_id").limit(1).maybeSingle();
  if (error) fail("Ev bilgisi okunamadı", error.message);
  if (!data) throw new Error("Hesabın bir eve bağlı değil. Supabase'de household_members tablosuna ekle.");
  return data.household_id as string;
}

export async function insertTransaction(t: Omit<Tx, "id" | "createdAt">, c?: SupabaseClient): Promise<void> {
  const supabase = await client(c);
  const household_id = await householdId(supabase);
  const { error } = await supabase.from("transactions").insert({
    household_id,
    amount: t.amount,
    from_name: t.from,
    to_name: t.to,
    date: t.date,
    currency: t.currency,
  });
  if (error) fail("İşlem kaydedilemedi", error.message);
}

/** "duplicate": aynı isimde kaynak zaten var. */
export async function insertSource(s: Omit<Source, "id">, c?: SupabaseClient): Promise<"ok" | "duplicate"> {
  const supabase = await client(c);
  const household_id = await householdId(supabase);
  const { error } = await supabase.from("sources").insert({ household_id, name: s.name, kind: s.kind, currency: s.currency });
  if (error?.code === "23505") return "duplicate";
  if (error) fail("Kaynak kaydedilemedi", error.message);
  return "ok";
}

/** false: kayıt bulunamadı (silinmiş ya da erişim yok). */
export async function updateTransactionRow(id: string, patch: { amount: number; date: string }, c?: SupabaseClient): Promise<boolean> {
  const supabase = await client(c);
  const { data, error } = await supabase.from("transactions").update(patch).eq("id", id).select("id");
  if (error) fail("Güncellenemedi", error.message);
  return (data?.length ?? 0) > 0;
}

export async function deleteTransactionRow(id: string, c?: SupabaseClient): Promise<void> {
  const supabase = await client(c);
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) fail("Silinemedi", error.message);
}
