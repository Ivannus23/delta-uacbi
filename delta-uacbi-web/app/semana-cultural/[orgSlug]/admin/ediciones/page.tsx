import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { requireOrgAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveOrganization, getActiveEdition } from "@/lib/semana-cultural";
import { ACADEMIC_UNITS, formatOrganizingUnitsLabel } from "@/lib/academic-catalog";
import { createEdition, activateEdition } from "./actions";

export const revalidate = 0;

export default async function AdminEdicionesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const organization = await resolveOrganization(orgSlug);
  await requireOrgAdmin(organization.id);

  const [activeEdition, editions] = await Promise.all([
    getActiveEdition(organization.id),
    db.culturalEdition.findMany({
      where: { organizationId: organization.id },
      orderBy: { year: "desc" },
    }),
  ]);

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana orgSlug={orgSlug} edition={activeEdition ?? undefined} />

        <section className="card-next rounded-3xl p-6">
          <h2 className="text-2xl font-semibold">Ediciones</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cada edición es un año de la semana cultural de esta organización. Solo una edición puede
            estar activa a la vez — es la que ven todos los módulos públicos y de staff.
          </p>

          <div className="mt-6 grid gap-3">
            {editions.length ? (
              editions.map((edition) => (
                <div
                  key={edition.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-medium">
                        {edition.name} · {edition.year}
                      </p>
                      {edition.isActive ? (
                        <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
                          Activa
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {edition.startDate.toLocaleDateString("es-MX")} –{" "}
                      {edition.endDate.toLocaleDateString("es-MX")} · Organiza:{" "}
                      {formatOrganizingUnitsLabel(edition.organizingUnitCodes) || "Sin definir"}
                    </p>
                  </div>

                  {!edition.isActive ? (
                    <form action={activateEdition.bind(null, organization.id, orgSlug, edition.id)}>
                      <button
                        type="submit"
                        className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
                      >
                        Activar
                      </button>
                    </form>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Aún no hay ediciones creadas.</p>
            )}
          </div>
        </section>

        <section className="card-next mt-6 rounded-3xl p-6">
          <h2 className="text-2xl font-semibold">Nueva edición</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Los catálogos (nombres de equipo, categorías de puntaje) y la cuota de inscripción se
            configuran por separado, una vez creada la edición.
          </p>

          <form
            action={createEdition.bind(null, organization.id, orgSlug)}
            className="mt-6 grid gap-4"
          >
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Nombre de la edición</label>
              <input
                name="editionName"
                required
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                placeholder="Ej. Semana Cultural UACBI 2027"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Año</label>
                <input
                  type="number"
                  name="year"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  placeholder="2027"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Fecha inicio</label>
                <input
                  type="date"
                  name="startDate"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Fecha fin</label>
                <input
                  type="date"
                  name="endDate"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-muted-foreground">
                Unidad(es) académica(s) organizadora(s)
              </label>
              <div className="max-h-56 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  {ACADEMIC_UNITS.map((unit) => (
                    <label key={unit.code} className="flex items-start gap-2 text-sm">
                      <input type="checkbox" name="organizingUnitCodes" value={unit.code} className="mt-1" />
                      <span>{unit.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" name="makeActive" defaultChecked={!activeEdition} />
              Activar esta edición inmediatamente (desactiva la edición actual)
            </label>

            <button
              type="submit"
              className="btn-sheen w-fit rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
            >
              Crear edición
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
