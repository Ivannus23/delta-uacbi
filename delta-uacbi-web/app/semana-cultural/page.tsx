import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";

export default function SemanaCulturalPage() {
  return (
    <>
      <Navbar />

      <main className="container py-12">
        <HeaderSemana />

        <section className="card-next rounded-3xl p-8">
          <h2 className="text-3xl font-semibold tracking-tight">Bienvenidos al modulo oficial</h2>

          <p className="mt-4 max-w-3xl text-muted-foreground leading-7">
            Aqui podras registrar equipos, consultar el cronograma, visualizar el ranking general y
            seguir las actividades de la Semana Cultural.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/semana-cultural/registro"
              className="btn-sheen rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Registrar equipo
            </Link>

            <Link
              href="/semana-cultural/mi-equipo"
              className="btn-sheen rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Mi equipo
            </Link>

            <Link
              href="/semana-cultural/ranking"
              className="btn-sheen rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Ver ranking
            </Link>

            <Link
              href="/semana-cultural/cronograma"
              className="btn-sheen rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Ver cronograma
            </Link>

            <Link
              href="/semana-cultural/resultados"
              className="btn-sheen rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Resultados en vivo
            </Link>

            <Link
              href="/semana-cultural/admin/dashboard"
              className="btn-sheen rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Panel staff
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
