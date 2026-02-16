import Link from "next/link";
import Image from "next/image";

const items = [
  { href: "/avisos", label: "Avisos" },
  { href: "/proyectos", label: "Proyectos" },
  { href: "/concursos", label: "Concursos" },
  { href: "/bolsa", label: "Bolsa" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/30 backdrop-blur">
      <div className="container flex items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo-delta.svg"
            alt="Delta UACBI"
            width={40}
            height={40}
            className="h-10 w-10"
            priority
          />
          <span className="font-semibold tracking-tight">Delta UACBI</span>
        </Link>

        <nav className="flex gap-2">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className="btn-sheen rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              {i.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
