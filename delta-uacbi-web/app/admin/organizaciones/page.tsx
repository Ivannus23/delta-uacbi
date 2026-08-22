import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ACADEMIC_UNITS, formatOrganizingUnitsLabel } from "@/lib/academic-catalog";
import { createOrganizationWithEdition, updateOrganizationSubscription } from "./actions";

export const revalidate = 0;

export default async function AdminOrganizacionesPage() {
  await requireAdmin();

  const organizations = await db.organization.findMany({
    include: {
      editions: {
        where: { isActive: true },
        take: 1,
        select: { name: true, organizingUnitCodes: true },
      },
      _count: {
        select: { memberships: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Organizaciones</h1>
        <p className="mt-2 text-muted-foreground">
          Cada organizacion opera su propia Semana Cultural de forma independiente.
        </p>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="card-next rounded-3xl p-6">
            <h2 className="text-2xl font-semibold">Nueva organizacion</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Crea una unidad academica nueva junto con su primera edicion activa.
            </p>

            <form action={createOrganizationWithEdition} className="mt-6 grid gap-4">
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Nombre de la organizacion</label>
                <input
                  name="orgName"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  placeholder="Ej. Unidad Academica de Odontologia"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Slug (para la URL)</label>
                <input
                  name="orgSlug"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  placeholder="Se genera del nombre si lo dejas vacio"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Nombre de la edicion</label>
                <input
                  name="editionName"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  placeholder="Ej. Semana Cultural Odontologia 2027"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">
                  Unidad(es) académica(s) organizadora(s)
                </label>
                <p className="mb-2 text-xs text-muted-foreground">
                  Selecciona una o varias si la edición es conjunta entre unidades.
                </p>
                <div className="max-h-56 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {ACADEMIC_UNITS.map((unit) => (
                      <label key={unit.code} className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="organizingUnitCodes"
                          value={unit.code}
                          className="mt-1"
                        />
                        <span>{unit.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
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

              <button
                type="submit"
                className="btn-sheen rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
              >
                Crear organizacion
              </button>
            </form>
          </section>

          <section className="card-next rounded-3xl p-6">
            <h2 className="text-2xl font-semibold">Organizaciones existentes</h2>

            <div className="mt-6 grid gap-4">
              {organizations.length ? (
                organizations.map((org) => (
                  <div key={org.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{org.name}</p>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs ${
                              org.subscriptionStatus === "SUSPENDED"
                                ? "border-rose-300/30 bg-rose-300/10 text-rose-100"
                                : "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                            }`}
                          >
                            {org.subscriptionStatus === "SUSPENDED" ? "Suspendida" : "Activa"}
                          </span>
                          {org.subscriptionPriceAmount ? (
                            <span className="text-xs text-muted-foreground">
                              ${Number(org.subscriptionPriceAmount).toFixed(2)}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          /{org.slug} · {org._count.memberships} miembro(s) ·{" "}
                          {org.editions[0] ? `Edicion activa: ${org.editions[0].name}` : "Sin edicion activa"}
                        </p>
                        {org.editions[0] ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Organiza: {formatOrganizingUnitsLabel(org.editions[0].organizingUnitCodes) || "Sin definir"}
                          </p>
                        ) : null}
                        {org.subscriptionNotes ? (
                          <p className="mt-1 text-xs text-muted-foreground">Notas: {org.subscriptionNotes}</p>
                        ) : null}
                      </div>
                      <Link
                        href={`/semana-cultural/${org.slug}`}
                        className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
                      >
                        Ver modulo
                      </Link>
                    </div>

                    <form
                      action={updateOrganizationSubscription.bind(null, org.id)}
                      className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-[auto_auto_1fr_auto]"
                    >
                      <select
                        name="subscriptionStatus"
                        defaultValue={org.subscriptionStatus}
                        className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                      >
                        <option value="ACTIVE">Activa</option>
                        <option value="SUSPENDED">Suspendida</option>
                      </select>
                      <input
                        type="number"
                        name="subscriptionPriceAmount"
                        step="0.01"
                        min="0"
                        defaultValue={org.subscriptionPriceAmount ? Number(org.subscriptionPriceAmount) : ""}
                        placeholder="Precio"
                        className="w-28 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                      />
                      <input
                        name="subscriptionNotes"
                        defaultValue={org.subscriptionNotes ?? ""}
                        placeholder="Notas (ej. paga por transferencia, vigente hasta marzo)"
                        className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                      />
                      <button
                        type="submit"
                        className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
                      >
                        Guardar
                      </button>
                    </form>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Aun no hay organizaciones creadas.</p>
              )}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
