import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { SuggestionSelect } from "@/components/semana-cultural/SuggestionSelect";
import { requireOrgAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveOrganization, getActiveEdition } from "@/lib/semana-cultural";
import { OrgRole } from "@prisma/client";
import { addOrgMember, removeOrgMember, updateOrgMemberRole } from "./actions";

export const revalidate = 0;

const roles = [
  { value: OrgRole.ADMIN, label: "Admin" },
  { value: OrgRole.STAFF, label: "Staff" },
];

export default async function AdminMiembrosPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const organization = await resolveOrganization(orgSlug);
  await requireOrgAdmin(organization.id);

  const [edition, memberships] = await Promise.all([
    getActiveEdition(organization.id),
    db.organizationMembership.findMany({
      where: { organizationId: organization.id },
      include: { user: true },
      orderBy: [{ role: "asc" }, { user: { name: "asc" } }],
    }),
  ]);

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana orgSlug={orgSlug} edition={edition} />

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="card-next rounded-3xl p-6">
            <h2 className="text-2xl font-semibold">Agregar miembro</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Los miembros con rol Admin o Staff pueden administrar esta organizacion.
            </p>

            <form action={addOrgMember.bind(null, organization.id, orgSlug)} className="mt-6 grid gap-4">
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Nombre</label>
                <input
                  name="name"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  placeholder="Nombre completo"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Correo</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  placeholder="correo@uan.edu.mx"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Rol</label>
                <SuggestionSelect
                  name="role"
                  required
                  options={roles}
                  defaultValue={OrgRole.STAFF}
                  placeholder="Selecciona un rol"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                />
              </div>

              <button
                type="submit"
                className="btn-sheen rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
              >
                Guardar miembro
              </button>
            </form>
          </section>

          <section className="card-next rounded-3xl p-6">
            <h2 className="text-2xl font-semibold">Miembros de la organizacion</h2>

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-sm text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Correo</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {memberships.length ? (
                    memberships.map((membership) => (
                      <tr key={membership.userId} className="border-t border-white/10">
                        <td className="px-4 py-3 font-medium">{membership.user.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{membership.user.email}</td>
                        <td className="px-4 py-3">{membership.role}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {roles.map((role) =>
                              role.value !== membership.role ? (
                                <form
                                  key={role.value}
                                  action={updateOrgMemberRole.bind(
                                    null,
                                    organization.id,
                                    orgSlug,
                                    membership.userId,
                                    role.value
                                  )}
                                >
                                  <button
                                    type="submit"
                                    className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                                  >
                                    {role.label}
                                  </button>
                                </form>
                              ) : null
                            )}
                            <form action={removeOrgMember.bind(null, organization.id, orgSlug, membership.userId)}>
                              <button
                                type="submit"
                                className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                              >
                                Quitar
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-muted-foreground">
                        Aún no hay miembros en esta organización.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
