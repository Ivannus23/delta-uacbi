import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { MembersSpreadsheet } from "@/components/semana-cultural/MembersSpreadsheet";
import { RegistroUnidadProgramaField } from "@/components/semana-cultural/RegistroUnidadProgramaField";
import { db } from "@/lib/db";
import { getOrgRole, getSessionUserInfo } from "@/lib/auth";
import {
  formatProgramLabel,
  formatUnitLabel,
  MAX_TEAM_MEMBERS,
  getTeamComposition,
} from "@/lib/semana-cultural-config";
import { resolveOrganization, getActiveEdition } from "@/lib/semana-cultural";
import { ACADEMIC_UNITS } from "@/lib/academic-catalog";
import { canSimulateTeamPayment } from "@/lib/semana-cultural-payments";
import {
  addMember,
  bulkAddMembersWithState,
  removeMember,
  initiateTeamPaymentCheckoutAction,
  simulateTeamPaymentPaidAction,
} from "./actions";

const TEAM_STATUS_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
};

export const revalidate = 0;

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; teamId: string }>;
}) {
  const { orgSlug, teamId } = await params;
  const organization = await resolveOrganization(orgSlug);
  const edition = await getActiveEdition(organization.id);
  if (!edition) return notFound();

  const team = await db.team.findFirst({
    where: {
      id: teamId,
      editionId: edition.id,
    },
    include: {
      members: {
        orderBy: [{ isLeader: "desc" }, { fullName: "asc" }],
      },
    },
  });

  if (!team) return notFound();

  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role: platformRole, id: userId, email: sessionEmail } = getSessionUserInfo(session.user);
  const orgRole = await getOrgRole(organization.id, userId, platformRole);

  const canManageTeam = orgRole === "ADMIN" || orgRole === "STAFF";
  const isLeaderById = Boolean(userId && team.leaderId === userId);
  const isLeaderByEmail = Boolean(sessionEmail && team.responsableCorreo.toLowerCase() === sessionEmail);

  if (!canManageTeam && !isLeaderById && !isLeaderByEmail) {
    redirect(`/semana-cultural/${orgSlug}`);
  }

  const memberCount = team.members.length;
  const remainingSlots = Math.max(0, MAX_TEAM_MEMBERS - memberCount);
  const compositionLabel = getTeamComposition(team.members.map((member) => member.academicUnitCode));

  const requiresFee = edition.registrationFeeMode === "FIXED";
  const latestPayment = requiresFee
    ? await db.teamPayment.findFirst({
        where: { teamId: team.id },
        orderBy: { createdAt: "desc" },
      })
    : null;
  const isPaid = latestPayment?.status === "PAID";
  const canSimulate = requiresFee && !isPaid ? await canSimulateTeamPayment(organization.id) : false;
  const hasMercadoPagoAccount =
    requiresFee && !isPaid
      ? Boolean(await db.organizationMercadoPagoAccount.findUnique({ where: { organizationId: organization.id } }))
      : false;

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana orgSlug={orgSlug} edition={edition} />

        <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <section className="card-next rounded-3xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold">Detalle del equipo</h2>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
                  {TEAM_STATUS_LABELS[team.status] ?? team.status}
                </span>
              </div>

              {canManageTeam ? (
                <a
                  href={`/api/semana-cultural/${orgSlug}/export-members?teamId=${team.id}`}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
                >
                  Exportar integrantes
                </a>
              ) : null}
            </div>

            {requiresFee ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                {isPaid ? (
                  <p className="text-sm font-medium text-emerald-300">Cuota de inscripción pagada ✓</p>
                ) : (
                  <>
                    <p className="text-sm text-amber-300">
                      Este equipo debe pagar ${Number(edition.registrationFeeAmount).toFixed(2)} de cuota de
                      inscripción antes de poder ser aprobado.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {hasMercadoPagoAccount ? (
                        <form action={initiateTeamPaymentCheckoutAction.bind(null, organization.id, orgSlug, team.id)}>
                          <button
                            type="submit"
                            className="btn-sheen rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                          >
                            Pagar cuota de inscripción
                          </button>
                        </form>
                      ) : null}
                      {canSimulate ? (
                        <form action={simulateTeamPaymentPaidAction.bind(null, organization.id, orgSlug, team.id)}>
                          <button
                            type="submit"
                            className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
                          >
                            Marcar como pagado (prueba)
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            ) : null}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Equipo / animal</p>
                <p className="mt-1 font-medium">{team.animal}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Composicion del equipo</p>
                <p className="mt-1 font-medium">{compositionLabel}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Responsable</p>
                <p className="mt-1 font-medium">{team.responsableNombre}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Telefono</p>
                <p className="mt-1 font-medium">{team.responsableTelefono}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Correo</p>
                <p className="mt-1 break-all font-medium">{team.responsableCorreo}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Unidad / carrera del responsable
                </p>
                <p className="mt-1 font-medium">
                  {formatUnitLabel(team.responsableAcademicUnitCode)} ·{" "}
                  {formatProgramLabel(team.responsableAcademicProgramCode)}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-muted-foreground">
                Participantes registrados:{" "}
                <span className="font-semibold text-foreground">
                  {memberCount}/{MAX_TEAM_MEMBERS}
                </span>
              </p>
            </div>
          </section>

          <section className="card-next rounded-3xl p-6">
            <h2 className="text-2xl font-semibold">Agregar integrante</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              El limite es {MAX_TEAM_MEMBERS} participantes por equipo incluyendo al encargado.
            </p>

            {remainingSlots > 0 ? (
              <form action={addMember.bind(null, organization.id, orgSlug, team.id)} className="mt-6 grid gap-4">
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
                  <label className="mb-2 block text-sm text-muted-foreground">Matricula</label>
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
                    placeholder="Ej. 4A"
                  />
                </div>

                <RegistroUnidadProgramaField
                  units={ACADEMIC_UNITS}
                  unidadName="academicUnit"
                  programName="academicProgram"
                  unidadLabel="Unidad academica del integrante"
                  programLabel="Carrera del integrante"
                />

                <button
                  type="submit"
                  className="btn-sheen mt-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
                >
                  Guardar integrante
                </button>
              </form>
            ) : (
              <p className="mt-4 text-sm text-amber-300">
                El equipo ya completo sus {MAX_TEAM_MEMBERS} participantes incluyendo al encargado.
              </p>
            )}
          </section>
        </div>

        <section className="mt-8">
          <MembersSpreadsheet
            key={`${team.id}-${remainingSlots}`}
            units={ACADEMIC_UNITS}
            remainingSlots={remainingSlots}
            maxTeamMembers={MAX_TEAM_MEMBERS}
            action={bulkAddMembersWithState.bind(null, organization.id, orgSlug, team.id)}
          />
        </section>

        <section className="mt-8 card-next rounded-3xl p-6">
          <h2 className="text-2xl font-semibold">Participantes del equipo</h2>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
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
                  <th className="px-4 py-3">Accion</th>
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
                      <td className="px-4 py-3">
                        {member.isLeader ? (
                          <span className="text-xs text-muted-foreground">Encargado protegido</span>
                        ) : (
                          <form action={removeMember.bind(null, organization.id, orgSlug, team.id, member.id)}>
                            <button
                              type="submit"
                              className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              Eliminar
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-muted-foreground">
                      Aun no hay participantes registrados para este equipo.
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
