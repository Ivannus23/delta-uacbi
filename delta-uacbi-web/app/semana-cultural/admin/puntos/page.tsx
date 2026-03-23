import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { SuggestionSelect } from "@/components/semana-cultural/SuggestionSelect";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveEdition } from "@/lib/semana-cultural";
import { assignScore, deleteScoreLog } from "./actions";
import { ScorePosition } from "@prisma/client";

export const revalidate = 3600;

const positions = [
  { value: ScorePosition.PRIMER_LUGAR, label: "1er lugar" },
  { value: ScorePosition.SEGUNDO_LUGAR, label: "2do lugar" },
  { value: ScorePosition.TERCER_LUGAR, label: "3er lugar" },
  { value: ScorePosition.PARTICIPACION, label: "Participacion" },
  { value: ScorePosition.PENALIZACION, label: "Penalizacion" },
];

export default async function AdminPuntosPage({
  searchParams,
}: {
  searchParams?: Promise<{ eventId?: string; unidad?: string }>;
}) {
  await requireStaff();

  const params = (await searchParams) ?? {};
  const selectedEventId = params.eventId || "";
  const selectedUnidad = params.unidad || "";

  const edition = await getActiveEdition();

  const [events, logs] = edition
    ? await Promise.all([
        db.event.findMany({
          where: { editionId: edition.id },
          include: {
            registrations: {
              where: { memberId: null },
              include: {
                team: true,
              },
            },
          },
          orderBy: { eventDate: "asc" },
        }),
        db.scoreLog.findMany({
          where: { editionId: edition.id },
          include: {
            team: true,
            event: true,
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
      ])
    : [[], []];

  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;

  const registeredTeams = selectedEvent
    ? selectedEvent.registrations
        .map((registration) => registration.team)
        .filter((team) => (selectedUnidad ? team.unidadAcademica === selectedUnidad : true))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const uniqueUnits = Array.from(
    new Set(
      events.flatMap((event) =>
        event.registrations.map((registration) => registration.team.unidadAcademica)
      )
    )
  ).sort();

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana />

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="card-next rounded-3xl p-6">
            <h2 className="text-2xl font-semibold">Asignar puntos</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Solo se pueden puntuar equipos inscritos en la actividad.
            </p>

            <form method="GET" className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Filtrar por actividad</label>
                <SuggestionSelect
                  name="eventId"
                  defaultValue={selectedEventId}
                  options={events.map((event) => ({
                    value: event.id,
                    label: `${event.name} · ${event.scoreCategory}`,
                  }))}
                  placeholder="Selecciona una actividad"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Unidad academica</label>
                <SuggestionSelect
                  name="unidad"
                  defaultValue={selectedUnidad}
                  options={uniqueUnits.map((unit) => ({ value: unit, label: unit }))}
                  placeholder="Todas"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
                />
              </div>

              <button
                type="submit"
                className="btn-sheen rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
              >
                Aplicar filtro
              </button>
            </form>

            <form action={assignScore} className="mt-6 grid gap-4">
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Actividad</label>
                <SuggestionSelect
                  name="eventId"
                  required
                  defaultValue={selectedEventId}
                  options={events.map((event) => ({
                    value: event.id,
                    label: `${event.name} · ${event.scoreCategory}`,
                  }))}
                  placeholder="Selecciona una actividad"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Equipo inscrito</label>
                <SuggestionSelect
                  name="teamId"
                  required
                  options={registeredTeams.map((team) => ({
                    value: team.id,
                    label: `${team.name} · ${team.unidadAcademica}`,
                  }))}
                  placeholder={
                    selectedEvent
                      ? "Selecciona un equipo inscrito"
                      : "Primero selecciona una actividad en el filtro"
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Resultado</label>
                <SuggestionSelect
                  name="position"
                  required
                  options={positions}
                  placeholder="Selecciona resultado"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Motivo / nota</label>
                <textarea
                  name="reason"
                  required
                  rows={3}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  placeholder="Ej. Ganador del torneo de FIFA"
                />
              </div>

              <button
                type="submit"
                className="btn-sheen rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
              >
                Guardar puntuacion
              </button>
            </form>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-lg font-semibold">Equipos inscritos en la actividad</h3>
              <div className="mt-3 grid gap-2">
                {selectedEvent ? (
                  registeredTeams.length ? (
                    registeredTeams.map((team) => (
                      <div
                        key={team.id}
                        className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm"
                      >
                        <span className="font-medium">{team.name}</span>
                        <span className="text-muted-foreground"> · {team.unidadAcademica}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No hay equipos inscritos con el filtro actual.
                    </p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Selecciona una actividad para ver sus equipos inscritos.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="card-next rounded-3xl p-6">
            <h2 className="text-2xl font-semibold">Historial reciente</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ultimos movimientos registrados en la tabla de puntos.
            </p>

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-sm text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Equipo</th>
                    <th className="px-4 py-3">Actividad</th>
                    <th className="px-4 py-3">Puntos</th>
                    <th className="px-4 py-3">Motivo</th>
                    <th className="px-4 py-3">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length ? (
                    logs.map((log) => (
                      <tr key={log.id} className="border-t border-white/10">
                        <td className="px-4 py-3 font-medium">{log.team.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {log.event?.name ?? "Sin actividad"}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {log.movementType === "RESTA" ? "-" : "+"}
                          {Math.abs(log.points)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{log.reason}</td>
                        <td className="px-4 py-3">
                          <form action={deleteScoreLog.bind(null, log.id, log.teamId)}>
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
                        Aun no hay movimientos de puntuacion.
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
