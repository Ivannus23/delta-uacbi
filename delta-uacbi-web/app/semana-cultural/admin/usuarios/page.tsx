import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { SuggestionSelect } from "@/components/semana-cultural/SuggestionSelect";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { createStaffUser, updateUserRole } from "./actions";
import { UserRole } from "@prisma/client";

export const revalidate = 60;

const roles = [
  { value: UserRole.ADMIN, label: "Admin" },
  { value: UserRole.STAFF, label: "Staff" },
  { value: UserRole.JEFE_GRUPO, label: "Jefe de grupo" },
];

export default async function AdminUsuariosPage() {
  await requireAdmin();

  const users = await db.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana />

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="card-next rounded-3xl p-6">
            <h2 className="text-2xl font-semibold">Crear o actualizar usuario</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Desde aquí puedes dar de alta staff o convertir usuarios existentes.
            </p>

            <form action={createStaffUser} className="mt-6 grid gap-4">
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
                  defaultValue={UserRole.STAFF}
                  placeholder="Selecciona un rol"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                />
              </div>

              <button
                type="submit"
                className="btn-sheen rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
              >
                Guardar usuario
              </button>
            </form>
          </section>

          <section className="card-next rounded-3xl p-6">
            <h2 className="text-2xl font-semibold">Usuarios del sistema</h2>

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-sm text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Correo</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">Cambiar rol</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length ? (
                    users.map((user) => (
                      <tr key={user.id} className="border-t border-white/10">
                        <td className="px-4 py-3 font-medium">{user.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                        <td className="px-4 py-3">{user.role}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {roles.map((role) =>
                              role.value !== user.role ? (
                                <form
                                  key={role.value}
                                  action={updateUserRole.bind(null, user.id, role.value)}
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
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-muted-foreground">
                        Aún no hay usuarios registrados.
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
