"use server";

import { revalidatePath } from "next/cache";
import { keyOf } from "@/lib/calc";
import { fmtDate, isISODate } from "@/lib/dates";
import { buildSchedule, validateRecurring } from "@/lib/recurring";
import { deleteTransactionRow, insertSource, insertTransaction, insertTransactions, readDb, updateTransactionRow } from "@/lib/store";
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
  revalidatePath("/islemler");
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

/** Tüm alanları düzenlenebilir işlem güncellemesi (İşlemler sayfası). */
export async function updateTransactionFull(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = text(fd, "id");
  const v = { amount: text(fd, "amount"), from: text(fd, "from"), to: text(fd, "to"), date: text(fd, "date"), currency: text(fd, "currency") || "TL" };
  const amount = parseAmount(v.amount);

  if (!v.amount || !Number.isFinite(amount) || amount <= 0) return { error: "Tutarı 0'dan büyük bir sayı olarak gir." };
  if (!isISODate(v.date)) return { error: "Tarih geçersiz." };
  if (!(CURRENCIES as readonly string[]).includes(v.currency)) return { error: "Para birimi geçersiz." };
  if (!v.from && !v.to) return { error: "Nereden ya da Nereye alanlarından en az biri dolu olmalı." };
  if (v.from && v.to && keyOf(v.from) === keyOf(v.to)) return { error: "Nereden ile Nereye aynı olamaz." };

  try {
    const db = await readDb();
    const found = await updateTransactionRow(id, {
      amount: Math.round(amount * 100) / 100,
      date: v.date,
      currency: v.currency,
      from: canonical(db, v.from),
      to: canonical(db, v.to),
    });
    if (!found) return { error: "Kayıt bulunamadı." };
  } catch (e) {
    return { error: errMsg(e) };
  }
  refresh();
  return { ok: true, message: "Kaydedildi", nonce: Date.now() };
}

/** Aylık tekrarlayan ödeme: tek formdan çok sayıda satır üretir. */
export async function addRecurring(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = {
    from: text(fd, "from"),
    to: text(fd, "to"),
    amount: text(fd, "amount"),
    step: text(fd, "step"),
    stepFrom: text(fd, "stepFrom"),
    count: text(fd, "count"),
    date: text(fd, "date"),
    currency: text(fd, "currency") || "TL",
  };
  const input = {
    amount: parseAmount(values.amount),
    step: values.step ? parseAmount(values.step) : 0,
    stepFrom: values.stepFrom ? Number(values.stepFrom) : 2,
    count: Number(values.count),
    firstDate: values.date,
  };

  if (!(CURRENCIES as readonly string[]).includes(values.currency)) return { error: "Para birimi geçersiz.", values };
  if (!values.from && !values.to) return { error: "Nereden ya da Nereye alanlarından en az biri dolu olmalı.", values };
  if (values.from && values.to && keyOf(values.from) === keyOf(values.to)) return { error: "Nereden ile Nereye aynı olamaz.", values };
  const problem = validateRecurring(input);
  if (problem) return { error: problem, values };

  const schedule = buildSchedule(input);
  try {
    const db = await readDb();
    const from = canonical(db, values.from);
    const to = canonical(db, values.to);
    await insertTransactions(schedule.map((s) => ({ amount: s.amount, from, to, date: s.date, currency: values.currency })));
  } catch (e) {
    return { error: errMsg(e), values };
  }
  refresh();
  return {
    ok: true,
    message: `${schedule.length} ödeme eklendi (${fmtDate(schedule[0].date)} – ${fmtDate(schedule[schedule.length - 1].date)}).`,
    values: { currency: values.currency, date: values.date },
    nonce: Date.now(),
  };
}
