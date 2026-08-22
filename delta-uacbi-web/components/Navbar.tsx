"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cx } from "@/components/ui/utils";

const navItems = [
  { href: "/avisos", label: "Avisos" },
  { href: "/proyectos", label: "Proyectos" },
  { href: "/concursos", label: "Concursos" },
  { href: "/bolsa", label: "Bolsa" },
  { href: "/semana-cultural", label: "Semana Cultural" },
  { href: "/tickets", label: "Delta Tickets" },
];

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
              <div className="font-display truncate font-semibold leading-tight tracking-tight">
                Delta UACBI
              </div>
              <div className="truncate text-xs text-muted-foreground">Comité académico</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <Button
                key={item.href}
                href={item.href}
                variant={isActive(item.href) ? "secondary" : "ghost"}
                size="sm"
                className={isActive(item.href) ? "text-foreground" : undefined}
              >
                {item.label}
              </Button>
            ))}
          </nav>

          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="md:hidden"
            aria-label="Abrir menú"
            aria-expanded={open}
            onClick={() =>
              setMobileMenuPath((previousPath) =>
                previousPath === currentPath ? null : currentPath
              )
            }
          >
            <span className="sr-only">Menú</span>
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
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
