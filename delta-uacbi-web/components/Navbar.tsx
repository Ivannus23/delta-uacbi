"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

const navItems = [
  { href: "/avisos", label: "Avisos" },
  { href: "/proyectos", label: "Proyectos" },
  { href: "/concursos", label: "Concursos" },
  { href: "/bolsa", label: "Bolsa" },
  { href: "/semana-cultural", label: "Semana Cultural" },
  { href: "/tickets", label: "Delta Tickets" },
];

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export function Navbar() {
  const pathname = usePathname();
  const currentPath = pathname ?? "/";
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const open = mobileMenuPath === currentPath;

  const isActive = useMemo(() => {
    return (href: string) => pathname === href || pathname?.startsWith(href + "/");
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/30 backdrop-blur">
      <div className="container py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Image
              src="/logo-delta.svg"
              alt="Delta UACBI"
              width={40}
              height={40}
              className="h-9 w-9 shrink-0"
              priority
            />
            <div className="min-w-0">
              <div className="truncate font-semibold leading-tight tracking-tight">
                Delta UACBI
              </div>
              <div className="truncate text-xs text-muted-foreground">Comité académico</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "btn-sheen rounded-full border px-3 py-1 text-sm",
                  "border-white/10 bg-white/5 hover:bg-white/10",
                  isActive(item.href)
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className="btn-sheen inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground md:hidden"
            aria-label="Abrir menú"
            aria-expanded={open}
            onClick={() =>
              setMobileMenuPath((previousPath) =>
                previousPath === currentPath ? null : currentPath
              )
            }
          >
            <span className="sr-only">Menú</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {open ? (
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-2 md:hidden">
            <div className="grid gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm",
                    "hover:bg-white/10",
                    isActive(item.href)
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setMobileMenuPath(null)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
