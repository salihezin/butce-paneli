# Bütçe paneli (Next.js + Supabase)

## Kurulum sırası
1. Supabase'de proje aç (bölge: Frankfurt). Authentication > Providers'ta e-posta girişi açık olsun.
2. Authentication > Users'tan kendi hesabını (ve ortak kullanacaksan diğer kişininkini) ekle.
3. SQL Editor'de sırayla çalıştır:
   1. `supabase/schema.sql`: tablolar ve RLS
   2. `supabase/bootstrap.sql`: önce içindeki e-postaları kendi e-postalarınla değiştir
   3. `supabase/seed.sql`: Excel verisi (tek seferlik; ikinci çalıştırmada hata verir)
   4. `supabase/002_odendi.sql`: "Ödendi" özelliği için `settled` sütunu ve `pay_obligations` fonksiyonu. **Mevcut kurulumda uygulamanın yeni sürümünü açmadan önce çalıştır.**
5. `.env.local.example` dosyasını `.env.local` olarak kopyala; Connect penceresindeki URL ve publishable key'i yapıştır.
6. `npm install && npm run dev` → http://localhost:3000 (giriş sayfasına yönlenir)

## Sayfalar
- **Panel** (`/`): kartlar.
- **İşlemler** (`/islemler`): arama, kaynak/zaman/tarih filtresi; satırı yerinde düzenle ya da sil. Varsayılan görünüm bugüne kadarki işlemler, en yeni üstte.
- **İşlem ekle** (`/islem/yeni`): tek işlem + **tekrarlayan ödeme** (aylık, en fazla 360 satır; kaydetmeden önce önizleme). Tutar zamanla artıyorsa "her ödemede artış" ve "artış kaçıncı ödemeden başlasın" doldurulur. Satırlar tek istekte eklenir: ya hepsi kaydolur ya hiçbiri.
- **Kaynak ekle**, **Vakıfbank kartı**: önceki gibi.

## Diğer özellikler
- **Özet satırı:** Panelde yaklaşan borçların üstünde "ödenecek / hesaplarında var / kalır ya da eksik". TL hesapların net toplamıyla TL borçlar karşılaştırılır; başka para birimleri çevrilmeden ayrıca yazılır.
- **Ödendi:** Yaklaşan borç kartında hesabı seçince ödeme (hesap → kurum, bugünün tarihiyle) kaydolur ve kartın satırları kapanır. "Hesaptan düşme, sadece kapat" seçeneği ödemeyi hesaplara yansıtmaz. Yanlışlıkla kapattıysan İşlemler sayfasında satırı düzenleyip "Ödendi" kutusunu kaldır; ödeme satırını da oradan silebilirsin.
- **CSV:** İşlemler sayfasında "Bu listeyi indir" (filtreli) ve "Hepsini indir"; Kaynak ekle sayfasında kaynak bakiyeleri. Ayraç `;`, ondalık `,`, UTF-8 BOM'lu: Türkçe Excel'de doğrudan açılır.
- **Telefona ekleme (PWA):** Android Chrome'da menü → "Ana ekrana ekle / Uygulamayı yükle"; iPhone Safari'de Paylaş → "Ana Ekrana Ekle". Çevrimdışı çalışmaz, veri Supabase'te.

## Yayına alma
Aynı iki ortam değişkenini Vercel'e gir. Supabase > Authentication > URL Configuration'a Vercel adresini ekle.

## Mimari
- `proxy.ts` + `lib/supabase/proxy.ts`: oturumu yeniler, girişsiz kullanıcıyı `/giris`'e yollar (`getClaims()` ile doğrular).
- `lib/store.ts`: tüm veritabanı erişimi burada. Yetki RLS ile veritabanında uygulanır.
- `lib/calc.ts`: panel kuralları (bakiye, yaklaşan, standart, alacak). Veritabanından bağımsız.
- Test için `APP_TODAY=2026-10-06 npm run dev` bugünü sabitler.

## Panel kuralları
- **Anlık neyim var / kimlere borcum var:** bakiye = gelen − giden. Sadece bugüne kadar olan işlemler sayılır.
- **Yaklaşan borçlar:** ileri tarihli, Nereden dolu / Nereye boş, Nereden bir "hesap" değil, vadesi bugün + 1 ay içinde. Aynı kurum + gün + para birimi tek kartta toplanır.
- **Standart ödemeler:** aynı kayıtların 1 aydan sonrası, kurum bazında.
- **Alacaklar:** ileri tarihli, Nereye bir kişi/borç kaynağı, Nereden boş.
- İsim eşleştirme Türkçe harfe duyarlı değil: `vadeli` = `VADELİ`.
