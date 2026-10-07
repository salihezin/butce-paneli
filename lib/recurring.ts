import { addMonths, isISODate } from "./dates";

export const MAX_COUNT = 360;

export type RecurringInput = {
  amount: number; // ilk ödemenin tutarı
  step: number; // her ödemede eklenen artış (negatif olabilir, 0 = sabit)
  stepFrom: number; // artış kaçıncı ödemeden itibaren uygulanır (en az 2)
  count: number; // toplam ödeme sayısı
  firstDate: string; // ilk ödeme tarihi; sonrakiler aynı gün, aylık
};

export type Installment = { date: string; amount: number };

/** Ev kredisi örneği: 4965,10 / artış 1 / artış 3. ödemeden → 4965,10 · 4965,10 · 4966,10 · 4967,10 … */
export function buildSchedule(i: RecurringInput): Installment[] {
  const out: Installment[] = [];
  for (let n = 1; n <= i.count; n++) {
    const bumps = Math.max(0, n - i.stepFrom + 1);
    out.push({
      // Her tarih ilk tarihten hesaplanır: 31 Ocak → 28 Şubat → 31 Mart (kayma olmaz).
      date: addMonths(i.firstDate, n - 1),
      amount: Math.round((i.amount + i.step * bumps) * 100) / 100,
    });
  }
  return out;
}

/** Hata metni döner, geçerliyse null. Hem formda (önizleme) hem sunucuda kullanılır. */
export function validateRecurring(i: RecurringInput): string | null {
  if (!Number.isFinite(i.amount) || i.amount <= 0) return "Başlangıç tutarını 0'dan büyük gir.";
  if (!Number.isInteger(i.count) || i.count < 2 || i.count > MAX_COUNT) return `Ödeme sayısı 2 ile ${MAX_COUNT} arasında olmalı.`;
  if (!isISODate(i.firstDate)) return "İlk ödeme tarihini seç.";
  if (!Number.isFinite(i.step)) return "Artış tutarı geçersiz.";
  if (!Number.isInteger(i.stepFrom) || i.stepFrom < 2 || i.stepFrom > i.count) return `Artış başlangıcı 2 ile ${i.count} arasında olmalı.`;
  if (buildSchedule(i).some((s) => s.amount <= 0)) return "Bu artışla bazı ödemeler 0 ya da negatif oluyor.";
  return null;
}
