export type Kind = "hesap" | "kisi" | "borc";

export type Source = { id: string; name: string; kind: Kind; currency: string };

/** from/to boş (null) ise Excel'deki "undefined" ile aynı: sistem dışı taraf. */
export type Tx = {
  id: string;
  amount: number;
  from: string | null;
  to: string | null;
  date: string; // YYYY-MM-DD
  currency: string;
  createdAt?: string; // sadece uygulamadan girilenlerde dolu
  settled?: boolean; // ileri tarihli borç satırı "ödendi" olarak kapatıldı
};

export type Db = { sources: Source[]; transactions: Tx[] };

export const CURRENCIES = ["TL", "USD", "EUR", "XAU"] as const;

export const KIND_LABEL: Record<Kind, string> = {
  hesap: "Hesap / varlık",
  kisi: "Kişi",
  borc: "Borç (kart, kredi)",
};

/** Vakıfbank kredi kartı kayıtlarını bulmak için isim öneki (Nereden sütunu). */
export const VB_KK_PREFIX = "VAKIFBANK KREDİ KARTI";
export const ALBARAKA_KK_PREFIX = "ALBARAKA KK"
export const CREDIT_CARD_BANKS = [
  {
    name: "Vakıfbank",
    prefix: VB_KK_PREFIX,
  },
  {
    name: "Albaraka",
    prefix: ALBARAKA_KK_PREFIX,
  },
] as const
/** "Ödendi" panelinde: hesaptan düşmeden sadece kartı kapat. */
export const NO_ACCOUNT = "__yok__";


