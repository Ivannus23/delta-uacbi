import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { requireOrgAdmin } from "@/lib/auth";
import { resolveOrganization, getActiveEdition } from "@/lib/semana-cultural";
import { getScoreCategories, getTeamNameOptions } from "@/lib/semana-cultural-catalog";
import { addScoreCategory, addTeamNameOption, deleteScoreCategory, deleteTeamNameOption } from "./actions";

export const revalidate = 0;

export default async function AdminCatalogosPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const organization = await resolveOrganization(orgSlug);
  await requireOrgAdmin(organization.id);

  const edition = await getActiveEdition(organization.id);

  const [teamNames, scoreCategories] = edition
    ? await Promise.all([getTeamNameOptions(edition.id), getScoreCategories(edition.id)])
    : [[], []];

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana orgSlug={orgSlug} edition={edition} />

        <section className="card-next rounded-3xl p-6">
          <h2 className="text-3xl font-semibold">Catálogos de la edición</h2>
          <p className="mt-2 text-muted-foreground">
            Configura los nombres de equipo disponibles y las categorías de puntaje para esta edición.
            Las unidades académicas y carreras usan el catálogo oficial de la UAN y no requieren
            configuración adicional.
          </p>
        </section>

        {!edition ? (
          <section className="card-next mt-6 rounded-3xl p-6">
            <p className="text-sm text-amber-300">Esta organización no tiene una edición activa.</p>
          </section>
        ) : (
          <>
            <section className="card-next mt-6 rounded-3xl p-6">
              <h3 className="text-2xl font-semibold">Nombres de equipo</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Lista de nombres disponibles para que los jefes de grupo elijan al registrar un equipo.
              </p>

              <form
                action={addTeamNameOption.bind(null, organization.id, orgSlug)}
                className="mt-4 flex flex-wrap gap-3"
              >
                <input
                  name="name"
                  required
                  placeholder="Ej. Águila"
                  className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                />
                <button
                  type="submit"
                  className="btn-sheen rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
                >
                  Agregar
                </button>
              </form>

              <div className="mt-5 flex flex-wrap gap-2">
                {teamNames.length ? (
                  teamNames.map((option) => (
                    <form
                      key={option.id}
                      action={deleteTeamNameOption.bind(null, organization.id, orgSlug, option.id)}
                      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-4 pr-2 text-sm"
                    >
                      <span>{option.name}</span>
                      <button
                        type="submit"
                        className="rounded-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        aria-label={`Eliminar ${option.name}`}
                      >
                        ×
                      </button>
                    </form>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Aún no hay nombres de equipo configurados.</p>
                )}
              </div>
            </section>

            <section className="card-next mt-6 rounded-3xl p-6">
              <h3 className="text-2xl font-semibold">Categorías de puntaje</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Categorías que se pueden asignar a actividades que suman puntos (ej. Deportivo, Cultural).
              </p>

              <form
                action={addScoreCategory.bind(null, organization.id, orgSlug)}
                className="mt-4 flex flex-wrap items-center gap-3"
              >
                <input
                  name="label"
                  required
                  placeholder="Ej. Deportivo"
                  className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                />
                <input
                  type="color"
                  name="colorHex"
                  defaultValue="#7dd3fc"
                  className="h-12 w-16 cursor-pointer rounded-2xl border border-white/10 bg-white/5"
                  aria-label="Color de la categoría"
                />
                <button
                  type="submit"
                  className="btn-sheen rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
                >
                  Agregar
                </button>
              </form>

              <div className="mt-5 flex flex-wrap gap-2">
                {scoreCategories.length ? (
                  scoreCategories.map((category) => (
                    <form
                      key={category.id}
                      action={deleteScoreCategory.bind(null, organization.id, orgSlug, category.id)}
                      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-4 pr-2 text-sm"
                    >
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: category.colorHex ?? "#a1a1aa" }}
                      />
                      <span>{category.label}</span>
                      <button
                        type="submit"
                        className="rounded-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        aria-label={`Eliminar ${category.label}`}
                      >
                        ×
                      </button>
                    </form>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Aún no hay categorías de puntaje configuradas.</p>
                )}
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
