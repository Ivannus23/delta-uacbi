import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { db } from "@/lib/db";
import { getActiveEdition } from "@/lib/semana-cultural";

export const revalidate = 60;

export default async function ResultadosPage() {
  const edition = await getActiveEdition();

  const [teams, scoreLogs, events] = edition
    ? await Promise.all([
        db.team.findMany({
          where: { editionId: edition.id },
          orderBy: [{ totalPoints: "desc" }, { name: "asc" }],
          take: 10,
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
          where: { editionId: edition.id },
          orderBy: { eventDate: "asc" },
          take: 8,
        }),
      ])
    : [[], [], []];

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana />

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card-next rounded-3xl p-6">
            <h2 className="text-3xl font-semibold">Ranking en vivo</h2>
            <p className="mt-2 text-muted-foreground">
              Clasificación general actual de equipos.
            </p>

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-sm text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Posición</th>
                    <th className="px-4 py-3">Equipo</th>
                    <th className="px-4 py-3">Unidad</th>
                    <th className="px-4 py-3">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.length ? (
                    teams.map((team, index) => (
                      <tr key={team.id} className="border-t border-white/10">
                        <td className="px-4 py-3 font-semibold">{index + 1}</td>
                        <td className="px-4 py-3 font-medium">{team.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{team.unidadAcademica}</td>
                        <td className="px-4 py-3 text-lg font-semibold">{team.totalPoints}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-muted-foreground">
                        Aún no hay resultados disponibles.
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
                        {log.team.name}
                        <span className="text-muted-foreground">
                          {" "}· {log.event?.name ?? "Sin actividad"}
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
                      <p className="font-medium">{event.name}</p>
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
