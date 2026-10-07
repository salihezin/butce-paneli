import { applyFilters, parseFilters } from "@/lib/filter";
import { sourcesCsv, transactionsCsv } from "@/lib/csv";
import { todayISO } from "@/lib/dates";
import { readDb } from "@/lib/store";

export const dynamic = "force-dynamic";

const BOM = "\uFEFF"; // Excel'in UTF-8 (Türkçe harfler) olarak açması için

/** /api/export → tüm işlemler · ?filtre=1&q=… → /islemler'deki filtreyle · ?tur=kaynaklar → kaynak bakiyeleri */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const today = todayISO();

  try {
    const db = await readDb();
    let body: string;
    let name: string;

    if (searchParams.get("tur") === "kaynaklar") {
      body = sourcesCsv(db, today);
      name = `butce-kaynaklar-${today}.csv`;
    } else {
      const rows = searchParams.get("filtre") === "1" ? applyFilters(db.transactions, parseFilters(Object.fromEntries(searchParams)), today) : db.transactions;
      body = transactionsCsv(rows);
      name = `butce-islemler-${today}.csv`;
    }

    return new Response(BOM + body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Dışa aktarılamadı.", { status: 500 });
  }
}
