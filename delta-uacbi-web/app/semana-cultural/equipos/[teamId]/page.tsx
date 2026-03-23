import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { db } from "@/lib/db";
import { getActiveEdition } from "@/lib/semana-cultural";
import { addMember, removeMember } from "./actions";

export const revalidate = 3600;

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const edition = await getActiveEdition();
  if (!edition) return notFound();

  const team = await db.team.findFirst({
    where: {
      id: teamId,
      editionId: edition.id,
    },
    include: {
      members: {
        orderBy: { fullName: "asc" },
      },
    },
  });

  if (!team) return notFound();

  const session = await auth();
  if (!session?.user) redirect("/login");

  const role =
    typeof session.user === "object" && session.user !== null && "role" in session.user
      ? session.user.role
      : null;
  const userId =
    typeof session.user === "object" && session.user !== null && "id" in session.user
      ? session.user.id
      : null;
  const canManageTeam = role === "ADMIN" || role === "STAFF";

  if (!canManageTeam && team.leaderId !== userId) {
    redirect("/semana-cultural");
  }

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana />

        <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <section className="card-next rounded-3xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h2 className="text-2xl font-semibold">Equipo registrado</h2>

              {canManageTeam ? (
                <a
                  href={`/api/semana-cultural/export-members?teamId=${team.id}`}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
                >
                  Exportar integrantes
                </a>
              ) : null}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Equipo</p>
                <p className="mt-1 font-medium">{team.name}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Unidad academica</p>
                <p className="mt-1 font-medium">{team.unidadAcademica}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Animal</p>
                <p className="mt-1 font-medium">{team.animal}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Color</p>
                <p className="mt-1 font-medium">{team.color}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Responsable</p>
                <p className="mt-1 font-medium">{team.responsableNombre}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Correo</p>
                <p className="mt-1 break-all font-medium">{team.responsableCorreo}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-muted-foreground">
                Integrantes registrados: <span className="font-semibold text-foreground">{team.members.length}/50</span>
              </p>
            </div>
          </section>

          <section className="card-next rounded-3xl p-6">
            <h2 className="text-2xl font-semibold">Agregar integrante</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Captura a cada integrante del equipo usando su información institucional.
            </p>

            <form action={addMember.bind(null, team.id)} className="mt-6 grid gap-4">
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Nombre completo</label>
                <input
                  name="fullName"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  placeholder="Nombre del integrante"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Matrícula</label>
                <input
                  name="matricula"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  placeholder="Ej. 22123456"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Correo institucional</label>
                <input
                  type="email"
                  name="institutionalEmail"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  placeholder="alumno@uan.edu.mx"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Grado y grupo</label>
                <input
                  name="gradoGrupo"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  placeholder="Ej. 4°B"
                />
              </div>

              <button
                type="submit"
                className="btn-sheen mt-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
              >
                Guardar integrante
              </button>
            </form>
          </section>
        </div>

        <section className="mt-8 card-next rounded-3xl p-6">
          <h2 className="text-2xl font-semibold">Integrantes del equipo</h2>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-sm text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Matrícula</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3">Grado y grupo</th>
                  <th className="px-4 py-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {team.members.length ? (
                  team.members.map((member) => (
                    <tr key={member.id} className="border-t border-white/10">
                      <td className="px-4 py-3">{member.fullName}</td>
                      <td className="px-4 py-3">{member.matricula}</td>
                      <td className="px-4 py-3 break-all text-muted-foreground">
                        {member.institutionalEmail}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{member.gradoGrupo}</td>
                      <td className="px-4 py-3">
                        <form action={removeMember.bind(null, team.id, member.id)}>
                          <button
                            type="submit"
                            className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Eliminar
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-muted-foreground">
                      Aún no hay integrantes registrados para este equipo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
