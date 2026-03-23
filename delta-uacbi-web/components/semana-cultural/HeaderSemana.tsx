import { LogoutButton } from "@/components/auth/LogoutButton";
import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/semana-cultural", label: "Inicio modulo" },
  { href: "/semana-cultural/mi-equipo", label: "Mi equipo" },
  { href: "/semana-cultural/ranking", label: "Ranking" },
  { href: "/semana-cultural/resultados", label: "Resultados en vivo" },
  { href: "/semana-cultural/staff", label: "Panel staff" },
];

type HeaderSemanaProps = {
  variant?: "hero" | "compact";
};

export function HeaderSemana({ variant = "compact" }: HeaderSemanaProps) {
  if (variant === "hero") {
    return (
      <div className="relative mb-8 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0e1524] shadow-[0_18px_55px_rgba(0,0,0,0.28)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(20,28,56,0.96)_0%,rgba(18,75,74,0.9)_38%,rgba(23,111,60,0.86)_70%,rgba(155,72,28,0.78)_100%)]" />
          <div className="absolute -left-8 top-0 h-28 w-28 rounded-full bg-fuchsia-400/18 blur-2xl" />
          <div className="absolute left-1/3 top-[-35%] h-32 w-32 rounded-full bg-yellow-300/18 blur-2xl" />
          <div className="absolute right-[-3%] top-3 h-28 w-28 rounded-full bg-sky-400/18 blur-2xl" />
          <div className="absolute bottom-[-35%] right-1/4 h-32 w-32 rounded-full bg-emerald-300/18 blur-2xl" />
          <div className="absolute inset-0 opacity-12 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.8)_1px,transparent_0)] [background-size:16px_16px]" />
        </div>

        <div className="relative p-4 sm:p-5 lg:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_370px] lg:items-center">
            <div className="grid gap-4">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-black/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/85 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-yellow-300" />
                Carnaval Brasileno
              </div>

              <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-[1.2rem] border border-white/20 bg-white/12 p-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-md">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[0.95rem] bg-[radial-gradient(circle_at_top,rgba(255,214,10,0.26),rgba(255,255,255,0.08)_48%,rgba(255,255,255,0.03)_100%)]">
                      <Image
                        src="/logo-delta-white.svg"
                        alt="Delta UACBI"
                        width={52}
                        height={52}
                        className="h-12 w-12 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]"
                      />
                    </div>
                  </div>

                  <div className="rounded-[1.2rem] border border-white/20 bg-white/12 p-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-md">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[0.95rem] bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.26),rgba(255,255,255,0.08)_48%,rgba(255,255,255,0.03)_100%)]">
                      <Image
                        src="/logo-pae-white.svg"
                        alt="Proyecto P.A.E"
                        width={52}
                        height={52}
                        className="h-12 w-12 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]"
                      />
                    </div>
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-100/90">
                    Proyecto conjunto
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    Semana Cultural UAE x UACBI
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/78">
                    Registro, actividades y puntuacion con una vibra de carnaval llena de color.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-950">
                    <span className="rounded-full bg-yellow-300 px-2.5 py-1">Musica</span>
                    <span className="rounded-full bg-emerald-300 px-2.5 py-1">Color</span>
                    <span className="rounded-full bg-sky-300 px-2.5 py-1">Fiesta</span>
                    <span className="rounded-full bg-fuchsia-300 px-2.5 py-1">Comunidad</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-white/15 bg-black/15 p-3.5 backdrop-blur-md">
              <div className="grid gap-2 sm:grid-cols-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="btn-sheen rounded-full border border-white/15 bg-white/10 px-3.5 py-2.5 text-center text-sm font-medium text-white transition hover:bg-white/16"
                  >
                    {link.label}
                  </Link>
                ))}
                <LogoutButton
                  callbackUrl="/"
                  className="rounded-full border border-white/15 bg-transparent px-3.5 py-2.5 text-sm font-medium text-white hover:bg-white/10 sm:col-span-2"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mb-6 overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#101728] shadow-[0_12px_32px_rgba(0,0,0,0.22)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,28,56,0.95)_0%,rgba(16,70,73,0.9)_42%,rgba(26,107,56,0.86)_100%)]" />
        <div className="absolute left-0 top-0 h-full w-1.5 bg-[linear-gradient(180deg,#facc15_0%,#f472b6_45%,#38bdf8_100%)]" />
        <div className="absolute right-0 top-0 h-full w-1.5 bg-[linear-gradient(180deg,#4ade80_0%,#facc15_50%,#38bdf8_100%)]" />
      </div>

      <div className="relative flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10">
              <Image
                src="/logo-delta-white.svg"
                alt="Delta UACBI"
                width={34}
                height={34}
                className="h-8 w-8 object-contain"
              />
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10">
              <Image
                src="/logo-pae-white.svg"
                alt="Proyecto P.A.E"
                width={34}
                height={34}
                className="h-8 w-8 object-contain"
              />
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-100/85">
              Carnaval Brasileno
            </p>
            <h1 className="truncate text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Semana Cultural UAE x UACBI
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="btn-sheen rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
            >
              {link.label}
            </Link>
          ))}
          <LogoutButton
            callbackUrl="/"
            className="rounded-full border border-white/15 bg-transparent px-3 py-2 text-sm text-white hover:bg-white/10"
          />
        </div>
      </div>
    </div>
  );
}
