import { LogoutButton } from "@/components/auth/LogoutButton";
import Image from "next/image";
import Link from "next/link";

export function HeaderSemana() {
  return (
    <div className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-black/20">
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
              <Image
                src="/logo-delta-white.svg"
                alt="Delta UACBI"
                width={56}
                height={56}
                className="h-12 w-12 object-contain"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
              <Image
                src="/logo-pae-white.svg"
                alt="Proyecto P.A.E"
                width={56}
                height={56}
                className="h-12 w-12 object-contain"
              />
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Proyecto conjunto
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Semana Cultural UAE x UACBI
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Plataforma oficial de registro, actividades y puntuacion
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/semana-cultural"
            className="btn-sheen rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Inicio modulo
          </Link>
          <Link
            href="/semana-cultural/mi-equipo"
            className="btn-sheen rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Mi equipo
          </Link>
          <Link
            href="/semana-cultural/ranking"
            className="btn-sheen rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Ranking
          </Link>
          <Link
            href="/semana-cultural/resultados"
            className="btn-sheen rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Resultados en vivo
          </Link>
          <Link
            href="/semana-cultural/admin/dashboard"
            className="btn-sheen rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Panel staff
          </Link>
          <LogoutButton
            callbackUrl="/"
            className="rounded-full border border-white/10 px-4 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
