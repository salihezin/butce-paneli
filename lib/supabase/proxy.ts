import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "./env";

/** Oturum token'ını yeniler ve giriş yapmamış kullanıcıyı /giris'e yönlendirir. */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url, key } = supabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  // getSession() değil getClaims(): token imzası doğrulanır, çerez sahte olamaz.
  const { data } = await supabase.auth.getClaims();
  const signedIn = !!data?.claims;
  const onLogin = request.nextUrl.pathname.startsWith("/giris");

  if (signedIn !== onLogin) return supabaseResponse; // (girişli & sayfa) ya da (girişsiz & /giris)

  // Yönlendirirken yenilenmiş çerezleri ve cache başlıklarını taşı.
  const target = request.nextUrl.clone();
  target.pathname = signedIn ? "/" : "/giris";
  const redirect = NextResponse.redirect(target);
  supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  for (const h of ["cache-control", "expires", "pragma"]) {
    const v = supabaseResponse.headers.get(h);
    if (v) redirect.headers.set(h, v);
  }
  return redirect;
}
