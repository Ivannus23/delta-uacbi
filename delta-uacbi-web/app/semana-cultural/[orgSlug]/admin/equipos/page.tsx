import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { requireOrgStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  formatProgramLabel,
  formatUnitLabel,
  MAX_TEAM_MEMBERS,
  getTeamComposition,
} from "@/lib/semana-cultural-config";
import { resolveOrganization, getActiveEdition } from "@/lib/semana-cultural";
import { updateTeamStatus } from "./actions";
import { TeamStatus } from "@prisma/client";
import { AdminTeamsMemberSearch } from "@/components/semana-cultural/AdminTeamsMemberSearch";

export const revalidate = 0;

export default async function AdminEquiposPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const organization = await resolveOrganization(orgSlug);
  await requireOrgStaff(organization.id);

  const edition = await getActiveEdition(organization.id);

  const teams = edition
    ? await db.team.findMany({
        where: {
          editionId: edition.id,
        },
        include: {
          members: {
            orderBy: [{ isLeader: "desc" }, { fullName: "asc" }],
          },
          payments: {
            where: { status: "PAID" },
            take: 1,
          },
        },
        orderBy: [{ totalPoints: "desc" }, { animal: "asc" }],
      })
    : [];

  const searchableTeams = teams.map((team) => ({
    id: team.id,
    animal: team.animal,
    status: team.status,
    responsableNombre: team.responsableNombre,
    responsableMatricula: team.responsableMatricula,
    responsableCorreo: team.responsableCorreo,
    members: team.members.map((member) => ({
      id: member.id,
      fullName: member.fullName,
      matricula: member.matricula,
      institutionalEmail: member.institutionalEmail,
      isLeader: member.isLeader,
    })),
  }));

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana orgSlug={orgSlug} edition={edition} />

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
                href={`/api/semana-cultural/${orgSlug}/export-teams`}
                className="btn-sheen rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                Exportar equipos
              </a>
              <a
                href={`/api/semana-cultural/${orgSlug}/export-rubro-3`}
                className="btn-sheen rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                Exportar rubro 3
              </a>
              <Link
                href={`/semana-cultural/${orgSlug}/registro`}
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
                  <th className="px-4 py-3">Animal / equipo</th>
                  <th className="px-4 py-3">Composicion</th>
                  <th className="px-4 py-3">Responsable</th>
                  <th className="px-4 py-3">Telefono</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3">Unidad/carrera responsable</th>
                  <th className="px-4 py-3">Participantes</th>
                  <th className="px-4 py-3">Puntos</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {teams.length ? (
                  teams.map((team) => {
                    const composition = getTeamComposition(team.members.map((member) => member.academicUnitCode));
                    const requiresFee = edition?.registrationFeeMode === "FIXED";
                    const isPaid = team.payments.length > 0;
                    return (
                      <tr key={team.id} className="border-t border-white/10">
                        <td className="px-4 py-3 font-medium">{team.animal}</td>
                        <td className="px-4 py-3 text-muted-foreground">{composition}</td>
                        <td className="px-4 py-3 text-muted-foreground">{team.responsableNombre}</td>
                        <td className="px-4 py-3 text-muted-foreground">{team.responsableTelefono}</td>
                        <td className="px-4 py-3 break-all text-muted-foreground">{team.responsableCorreo}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatUnitLabel(team.responsableAcademicUnitCode)} ·{" "}
                          {formatProgramLabel(team.responsableAcademicProgramCode)}
                        </td>
                        <td className="px-4 py-3">
                          {team.members.length}/{MAX_TEAM_MEMBERS}
                        </td>
                        <td className="px-4 py-3 font-semibold">{team.totalPoints}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
                            {team.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/semana-cultural/${orgSlug}/equipos/${team.id}`}
                              className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              Ver equipo
                            </Link>

                            {team.status !== "APROBADO" ? (
                              requiresFee && !isPaid ? (
                                <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs text-amber-200">
                                  Pendiente de pago
                                </span>
                              ) : (
                                <form action={updateTeamStatus.bind(null, organization.id, orgSlug, team.id, TeamStatus.APROBADO)}>
                                  <button
                                    type="submit"
                                    className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                                  >
                                    Aprobar
                                  </button>
                                </form>
                              )
                            ) : null}

                            {team.status !== "RECHAZADO" ? (
                              <form action={updateTeamStatus.bind(null, organization.id, orgSlug, team.id, TeamStatus.RECHAZADO)}>
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
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="px-4 py-6 text-muted-foreground">
                      Aun no hay equipos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8">
          <AdminTeamsMemberSearch teams={searchableTeams} orgSlug={orgSlug} />
        </section>

        <section className="mt-8 grid gap-4">
          {teams.length
            ? teams.map((team) => {
                const composition = getTeamComposition(team.members.map((member) => member.academicUnitCode));
                return (
                  <details key={team.id} className="card-next rounded-3xl p-5">
                    <summary className="list-none cursor-pointer">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-semibold">{team.animal}</h3>
                            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
                              {team.status}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {composition} · {team.members.length}/{MAX_TEAM_MEMBERS} participantes ·{" "}
                            {team.responsableNombre}
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
                          href={`/api/semana-cultural/${orgSlug}/export-members?teamId=${team.id}`}
                          className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
                        >
                          Exportar integrantes
                        </a>
                        <Link
                          href={`/semana-cultural/${orgSlug}/equipos/${team.id}`}
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
                              <th className="px-4 py-3">Matricula</th>
                              <th className="px-4 py-3">Correo</th>
                              <th className="px-4 py-3">Grado y grupo</th>
                              <th className="px-4 py-3">Unidad academica</th>
                              <th className="px-4 py-3">Carrera</th>
                              <th className="px-4 py-3">Rol</th>
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
                                  <td className="px-4 py-3 text-muted-foreground">
                                    {formatUnitLabel(member.academicUnitCode)}
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground">
                                    {formatProgramLabel(member.academicProgramCode)}
                                  </td>
                                  <td className="px-4 py-3">
                                    {member.isLeader ? (
                                      <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
                                        Encargado
                                      </span>
                                    ) : (
                                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
                                        Integrante
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={7} className="px-4 py-6 text-muted-foreground">
                                  Aun no hay participantes registrados para este equipo.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </details>
                );
              })
            : null}
        </section>
      </main>
      <Footer />
    </>
  );
}
