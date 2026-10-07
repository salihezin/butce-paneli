"use server";

import { revalidatePath } from "next/cache";
import { keyOf } from "@/lib/calc";
import { isISODate } from "@/lib/dates";
import { deleteTransactionRow, insertSource, insertTransaction, readDb, updateTransactionRow } from "@/lib/store";
import { CURRENCIES, type Db, type Kind } from "@/lib/types";

export type FormState = {
  ok?: boolean;
  message?: string;
  error?: string;
  values?: Record<string, string>;
  nonce?: number;
};

const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim().replace(/\s+/g, " ");
const parseAmount = (s: string) => Number(s.replace(",", "."));

/** Aynı isim farklı yazılmışsa (vadeli / VADELİ) mevcut yazımı kullan. */
function canonical(db: Db, raw: string): string | null {
  if (!raw) return null;
  const k = keyOf(raw);
  const src = db.sources.find((s) => keyOf(s.name) === k);
  if (src) return src.name;
  const seen = db.transactions.flatMap((t) => [t.from, t.to]).find((n) => n && keyOf(n) === k);
  return seen ?? raw;
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Beklenmeyen bir hata oluştu.");

function refresh() {
  revalidatePath("/");
  revalidatePath("/islem/yeni");
  revalidatePath("/kaynak/yeni");
  revalidatePath("/kredi-karti");
}

export async function addTransaction(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = {
    amount: text(fd, "amount"),
    from: text(fd, "from"),
    to: text(fd, "to"),
    date: text(fd, "date"),
    currency: text(fd, "currency") || "TL",
  };
  const amount = parseAmount(values.amount);

  if (!values.amount || !Number.isFinite(amount) || amount <= 0) return { error: "Tutarı 0'dan büyük bir sayı olarak gir.", values };
  if (!isISODate(values.date)) return { error: "Tarih seç.", values };
  if (!(CURRENCIES as readonly string[]).includes(values.currency)) return { error: "Para birimi geçersiz.", values };
  if (!values.from && !values.to) return { error: "Nereden ya da Nereye alanlarından en az biri dolu olmalı.", values };
  if (values.from && values.to && keyOf(values.from) === keyOf(values.to)) return { error: "Nereden ile Nereye aynı olamaz.", values };

  try {
    const db = await readDb();
    await insertTransaction({
      amount: Math.round(amount * 100) / 100,
      from: canonical(db, values.from),
      to: canonical(db, values.to),
      date: values.date,
      currency: values.currency,
    });
  } catch (e) {
    return { error: errMsg(e), values };
  }
  refresh();
  return {
    ok: true,
    message: `İşlem kaydedildi: ${values.from || "—"} → ${values.to || "—"}, ${amount.toLocaleString("tr-TR")} ${values.currency}.`,
    values: { date: values.date, currency: values.currency },
    nonce: Date.now(),
  };
}

export async function addSource(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = { name: text(fd, "name"), kind: text(fd, "kind"), currency: text(fd, "currency") || "TL" };

  if (!values.name) return { error: "Kaynağa bir isim ver.", values };
  if (!["hesap", "kisi", "borc"].includes(values.kind)) return { error: "Türü seç.", values };
  if (!(CURRENCIES as readonly string[]).includes(values.currency)) return { error: "Para birimi geçersiz.", values };

  try {
    const db = await readDb();
    if (db.sources.some((x) => keyOf(x.name) === keyOf(values.name))) return { error: `"${values.name}" zaten kayıtlı.`, values };
    const r = await insertSource({ name: values.name, kind: values.kind as Kind, currency: values.currency });
    if (r === "duplicate") return { error: `"${values.name}" zaten kayıtlı.`, values };
  } catch (e) {
    return { error: errMsg(e), values };
  }

  refresh();
  return { ok: true, message: `Kaynak eklendi: ${values.name}.`, values: { currency: values.currency }, nonce: Date.now() };
}

export async function updateTransaction(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = text(fd, "id");
  const date = text(fd, "date");
  const amount = parseAmount(text(fd, "amount"));
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Tutar geçersiz." };
  if (!isISODate(date)) return { error: "Tarih geçersiz." };

  try {
    const found = await updateTransactionRow(id, { amount: Math.round(amount * 100) / 100, date });
    if (!found) return { error: "Kayıt bulunamadı." };
  } catch (e) {
    return { error: errMsg(e) };
  }
  refresh();
  return { ok: true, message: "Kaydedildi", nonce: Date.now() };
}

export async function deleteTransaction(fd: FormData): Promise<void> {
  const id = text(fd, "id");
  await deleteTransactionRow(id);
  refresh();
}
