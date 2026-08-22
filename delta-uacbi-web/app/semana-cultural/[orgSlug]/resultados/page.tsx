import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { db } from "@/lib/db";
import { getTeamComposition } from "@/lib/semana-cultural-config";
import { resolveOrganization, getActiveEdition } from "@/lib/semana-cultural";

export const revalidate = 60;

function getEventBadgeLabel(event: { isScored: boolean; scoreCategory: { label: string } | null }) {
  if (!event.isScored) return "Solo cronograma";
  return event.scoreCategory?.label ?? "Sin categoría";
}

export default async function ResultadosPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const organization = await resolveOrganization(orgSlug);
  const edition = await getActiveEdition(organization.id);

  const [teams, scoreLogs, events] = edition
    ? await Promise.all([
        db.team.findMany({
          where: { editionId: edition.id },
          orderBy: [{ totalPoints: "desc" }, { animal: "asc" }],
          take: 10,
          select: {
            id: true,
            animal: true,
            totalPoints: true,
            members: {
              select: {
                academicUnitCode: true,
              },
            },
          },
        }),
        db.scoreLog.findMany({
          where: { editionId: edition.id },
          include: {
            team: true,
            event: true,
          },
          orderBy: { createdAt: "desc" },
          take: 15,
        }),
        db.event.findMany({
          where: { editionId: edition.id, isVisible: true },
          include: { scoreCategory: true },
          orderBy: { eventDate: "asc" },
          take: 8,
        }),
      ])
    : [[], [], []];

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana orgSlug={orgSlug} edition={edition} />

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card-next rounded-3xl p-6">
            <h2 className="text-3xl font-semibold">Ranking en vivo</h2>
            <p className="mt-2 text-muted-foreground">Clasificacion general actual de equipos.</p>

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-sm text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Posicion</th>
                    <th className="px-4 py-3">Equipo</th>
                    <th className="px-4 py-3">Composicion</th>
                    <th className="px-4 py-3">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.length ? (
                    teams.map((team, index) => (
                      <tr key={team.id} className="border-t border-white/10">
                        <td className="px-4 py-3 font-semibold">{index + 1}</td>
                        <td className="px-4 py-3 font-medium">{team.animal}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {getTeamComposition(team.members.map((member) => member.academicUnitCode))}
                        </td>
                        <td className="px-4 py-3 text-lg font-semibold">{team.totalPoints}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-muted-foreground">
                        Aun no hay resultados disponibles.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-6">
            <section className="card-next rounded-3xl p-6">
              <h2 className="text-2xl font-semibold">Movimientos recientes</h2>
              <div className="mt-4 grid gap-3">
                {scoreLogs.length ? (
                  scoreLogs.map((log) => (
                    <div key={log.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="font-medium">
                        {log.team.animal}
                        <span className="text-muted-foreground">
                          {" "}
                          · {log.event?.name ?? "Sin actividad"}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{log.reason}</p>
                      <p className="mt-2 text-sm font-semibold">
                        {log.movementType === "RESTA" ? "-" : "+"}
                        {Math.abs(log.points)} pts
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Sin movimientos recientes.</p>
                )}
              </div>
            </section>

            <section className="card-next rounded-3xl p-6">
              <h2 className="text-2xl font-semibold">Actividades destacadas</h2>
              <div className="mt-4 grid gap-3">
                {events.length ? (
                  events.map((event) => (
                    <div key={event.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{event.name}</p>
                        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-muted-foreground">
                          {getEventBadgeLabel(event)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{event.place}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Sin actividades visibles.</p>
                )}
              </div>
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
