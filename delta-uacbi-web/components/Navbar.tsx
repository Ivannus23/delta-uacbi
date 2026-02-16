"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

const navItems = [
  { href: "/avisos", label: "Avisos" },
  { href: "/proyectos", label: "Proyectos" },
  { href: "/concursos", label: "Concursos" },
  { href: "/bolsa", label: "Bolsa" },
];

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = useMemo(() => {
    return (href: string) => pathname === href || pathname?.startsWith(href + "/");
  }, [pathname]);

  useEffect(() => {
    // Cierra el menú al cambiar de ruta
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/30 backdrop-blur">
      <div className="container py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 min-w-0">
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
              <div className="truncate text-xs text-muted-foreground">
                Comité académico
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className={cx(
                  "btn-sheen rounded-full border px-3 py-1 text-sm",
                  "border-white/10 bg-white/5 hover:bg-white/10",
                  isActive(i.href) ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {i.label}
              </Link>
            ))}
          </nav>

          {/* Mobile button */}
          <button
            type="button"
            className="md:hidden btn-sheen inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
            aria-label="Abrir menú"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {/* icon */}
            <span className="sr-only">Menú</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Mobile panel */}
        {open ? (
          <div className="md:hidden mt-3 rounded-2xl border border-white/10 bg-black/40 p-2">
            <div className="grid gap-2">
              {navItems.map((i) => (
                <Link
                  key={i.href}
                  href={i.href}
                  className={cx(
                    "rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm",
                    "hover:bg-white/10",
                    isActive(i.href) ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {i.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
