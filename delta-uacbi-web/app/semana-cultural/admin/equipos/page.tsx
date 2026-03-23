import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveEdition } from "@/lib/semana-cultural";
import { updateTeamStatus } from "./actions";
import { TeamStatus } from "@prisma/client";

export const revalidate = 3600;

export default async function AdminEquiposPage() {
  await requireStaff();

  const edition = await getActiveEdition();

  const teams = edition
    ? await db.team.findMany({
        where: {
          editionId: edition.id,
        },
        include: {
          members: {
            orderBy: { fullName: "asc" },
          },
        },
        orderBy: [{ totalPoints: "desc" }, { name: "asc" }],
      })
    : [];

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana />

        <section className="card-next rounded-3xl p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold">Panel staff · Equipos</h2>
              <p className="mt-2 text-muted-foreground">
                Consulta equipos registrados, responsables e integrantes capturados.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/api/semana-cultural/export-teams"
                className="btn-sheen rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                Exportar equipos
              </a>
              <Link
                href="/semana-cultural/registro"
                className="btn-sheen rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                Nuevo equipo
              </Link>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-sm text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Equipo</th>
                  <th className="px-4 py-3">Unidad</th>
                  <th className="px-4 py-3">Animal</th>
                  <th className="px-4 py-3">Color</th>
                  <th className="px-4 py-3">Responsable</th>
                  <th className="px-4 py-3">Integrantes</th>
                  <th className="px-4 py-3">Puntos</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {teams.length ? (
                  teams.map((team) => (
                    <tr key={team.id} className="border-t border-white/10">
                      <td className="px-4 py-3 font-medium">{team.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{team.unidadAcademica}</td>
                      <td className="px-4 py-3 text-muted-foreground">{team.animal}</td>
                      <td className="px-4 py-3 text-muted-foreground">{team.color}</td>
                      <td className="px-4 py-3 text-muted-foreground">{team.responsableNombre}</td>
                      <td className="px-4 py-3">{team.members.length}/50</td>
                      <td className="px-4 py-3 font-semibold">{team.totalPoints}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
                          {team.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/semana-cultural/equipos/${team.id}`}
                            className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Ver equipo
                          </Link>

                          {team.status !== "APROBADO" ? (
                            <form action={updateTeamStatus.bind(null, team.id, TeamStatus.APROBADO)}>
                              <button
                                type="submit"
                                className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                              >
                                Aprobar
                              </button>
                            </form>
                          ) : null}

                          {team.status !== "RECHAZADO" ? (
                            <form action={updateTeamStatus.bind(null, team.id, TeamStatus.RECHAZADO)}>
                              <button
                                type="submit"
                                className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                              >
                                Rechazar
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-muted-foreground">
                      Aún no hay equipos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 grid gap-4">
          {teams.length
            ? teams.map((team) => (
                <details key={team.id} className="card-next rounded-3xl p-5">
                  <summary className="list-none cursor-pointer">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-semibold">{team.name}</h3>
                          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
                            {team.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {team.unidadAcademica} · {team.members.length}/50 integrantes · {team.responsableNombre}
                        </p>
                      </div>

                      <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
                        Ver integrantes
                      </div>
                    </div>
                  </summary>

                  <div className="mt-5 border-t border-white/10 pt-5">
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`/api/semana-cultural/export-members?teamId=${team.id}`}
                        className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
                      >
                        Exportar integrantes
                      </a>
                      <Link
                        href={`/semana-cultural/equipos/${team.id}`}
                        className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
                      >
                        Abrir equipo
                      </Link>
                    </div>

                    <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
                      <table className="w-full text-left">
                        <thead className="bg-white/5 text-sm text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">Matrícula</th>
                            <th className="px-4 py-3">Correo</th>
                            <th className="px-4 py-3">Grado y grupo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {team.members.length ? (
                            team.members.map((member) => (
                              <tr key={member.id} className="border-t border-white/10">
                                <td className="px-4 py-3 font-medium">{member.fullName}</td>
                                <td className="px-4 py-3 text-muted-foreground">{member.matricula}</td>
                                <td className="px-4 py-3 break-all text-muted-foreground">
                                  {member.institutionalEmail}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">{member.gradoGrupo}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-4 py-6 text-muted-foreground">
                                Aún no hay integrantes registrados para este equipo.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </details>
              ))
            : null}
        </section>
      </main>
      <Footer />
    </>
  );
}
