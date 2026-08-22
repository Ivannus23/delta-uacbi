import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { resolveOrganization, getActiveEdition } from "@/lib/semana-cultural";

export default async function SemanaCulturalOrgPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const organization = await resolveOrganization(orgSlug);
  const edition = await getActiveEdition(organization.id);
  const base = `/semana-cultural/${orgSlug}`;

  return (
    <>
      <Navbar />

      <main className="container py-12">
        <HeaderSemana variant="hero" orgSlug={orgSlug} edition={edition} />

        <section className="card-next rounded-3xl p-8">
          <h2 className="text-3xl font-semibold tracking-tight">Bienvenidos al modulo oficial</h2>

          <p className="mt-4 max-w-3xl text-muted-foreground leading-7">
            Aqui podras registrar equipos, consultar el cronograma, visualizar el ranking general y
            seguir las actividades de la Semana Cultural de {organization.name}.
          </p>

          {!edition ? (
            <p className="mt-4 text-sm text-amber-300">
              Esta organizacion todavia no tiene una edicion activa.
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`${base}/registro`}
              className="btn-sheen rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Registrar equipo
            </Link>

            <Link
              href={`${base}/mi-equipo`}
              className="btn-sheen rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Mi equipo
            </Link>

            <Link
              href={`${base}/ranking`}
              className="btn-sheen rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Ver ranking
            </Link>

            <Link
              href={`${base}/cronograma`}
              className="btn-sheen rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Ver cronograma
            </Link>

            <Link
              href={`${base}/resultados`}
              className="btn-sheen rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Resultados en vivo
            </Link>

            <Link
              href={`${base}/staff`}
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
