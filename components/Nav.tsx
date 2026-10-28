"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/auth-actions";

const LINKS = [
  { href: "/", label: "Panel" },
  { href: "/islemler", label: "İşlemler" },
  { href: "/islem/yeni", label: "İşlem ekle" },
  { href: "/kaynak/yeni", label: "Kaynak ekle" },
  { href: "/kredi-karti", label: "Kredi kartları" },
];

export default function Nav() {
  const path = usePathname();
  const onLogin = path.startsWith("/giris");
  return (
    <header className="border-b border-cizgi bg-kagit">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 sm:px-6">
        <span className="text-lg font-semibold tracking-tight">Bütçe</span>
        {!onLogin && (
          <>
            <nav className="flex flex-wrap gap-1" aria-label="Ana menü">
              {LINKS.map((l) => {
                const active = l.href === "/" ? path === "/" : path === l.href || path.startsWith(l.href + "/");
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      active ? "bg-murekkep text-white" : "text-sessiz hover:bg-zemin hover:text-murekkep"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
            <form action={signOut} className="ml-auto">
              <button className="rounded-md px-3 py-1.5 text-sm font-medium text-sessiz transition-colors hover:bg-zemin hover:text-murekkep">
                Çıkış yap
              </button>
            </form>
          </>
        )}
      </div>
    </header>
  );
}
