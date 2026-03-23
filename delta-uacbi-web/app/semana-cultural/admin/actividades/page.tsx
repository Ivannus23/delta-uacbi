import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { requireStaff } from "@/lib/auth";
import { getActiveEditionWithEvents, getAvailableTeams } from "@/lib/events";
import { getAvailableMembers } from "@/lib/members";
import {
  createEvent,
  registerTeamToEvent,
  removeTeamFromEvent,
  registerMemberToEvent,
  removeMemberFromEvent,
} from "./actions";
import { updateEventStatus, toggleCheckIn } from "./operations";
import { EventStatus, EventType, ScoreCategory } from "@prisma/client";

export const revalidate = 3600;

const eventTypes = [
  { value: EventType.DEPORTIVA, label: "Deportiva" },
  { value: EventType.CULTURAL, label: "Cultural" },
  { value: EventType.RECREATIVA, label: "Recreativa" },
  { value: EventType.ACADEMICA, label: "Académica" },
  { value: EventType.VIDEOJUEGO, label: "Videojuego" },
  { value: EventType.OTRA, label: "Otra" },
];

const scoreCategories = [
  { value: ScoreCategory.TOPACIO, label: "Topacio" },
  { value: ScoreCategory.DIAMANTE, label: "Diamante" },
  { value: ScoreCategory.ESMERALDA, label: "Esmeralda" },
];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function statusLabel(status: EventStatus) {
  switch (status) {
    case EventStatus.BORRADOR:
      return "Borrador";
    case EventStatus.ABIERTA:
      return "Abierta";
    case EventStatus.CERRADA:
      return "Cerrada";
    case EventStatus.FINALIZADA:
      return "Finalizada";
    default:
      return status;
  }
}

export default async function AdminActividadesPage() {
  await requireStaff();

  const data = await getActiveEditionWithEvents();
  const [teams, members] = await Promise.all([
    getAvailableTeams(),
    getAvailableMembers(),
  ]);

  const events = data?.events ?? [];

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana />

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="card-next rounded-3xl p-6">
            <h2 className="text-2xl font-semibold">Nueva actividad</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Crea actividades nuevas o complementarias del cronograma.
            </p>

            <form action={createEvent} className="mt-6 grid gap-4">
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Nombre</label>
                <input
                  name="name"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  placeholder="Ej. Torneo relámpago de ajedrez"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Slug</label>
                <input
                  name="slug"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  placeholder="torneo-relampago-de-ajedrez"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-muted-foreground">Tipo</label>
                  <select
                    name="type"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  >
                    <option value="">Selecciona tipo</option>
                    {eventTypes.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-muted-foreground">Categoría de puntos</label>
                  <select
                    name="scoreCategory"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  >
                    <option value="">Selecciona categoría</option>
                    {scoreCategories.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Lugar</label>
                <input
                  name="place"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  placeholder="Lugar de la actividad"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-muted-foreground">Fecha y hora</label>
                  <input
                    type="datetime-local"
                    name="eventDate"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-muted-foreground">Cupo de equipos</label>
                  <input
                    type="number"
                    min={1}
                    name="teamCapacity"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                    placeholder="Opcional"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-muted-foreground">Cupo de integrantes</label>
                  <input
                    type="number"
                    min={1}
                    name="memberCapacity"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Descripción</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  placeholder="Descripción breve"
                />
              </div>

              <button
                type="submit"
                className="btn-sheen rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
              >
                Crear actividad
              </button>
            </form>
          </section>

          <section className="grid gap-6">
            <section className="card-next rounded-3xl p-6">
              <h2 className="text-2xl font-semibold">Inscribir equipo a actividad</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Asigna equipos aprobados a las actividades disponibles.
              </p>

              <form action={registerTeamToEvent} className="mt-6 grid gap-4">
                <div>
                  <label className="mb-2 block text-sm text-muted-foreground">Actividad</label>
                  <select
                    name="eventId"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  >
                    <option value="">Selecciona actividad</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name} · {event.scoreCategory}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-muted-foreground">Equipo</label>
                  <select
                    name="teamId"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  >
                    <option value="">Selecciona equipo</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} · {team.unidadAcademica}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-muted-foreground">Notas</label>
                  <textarea
                    name="notes"
                    rows={2}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                    placeholder="Opcional"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-sheen rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
                >
                  Registrar en actividad
                </button>
              </form>
            </section>

            <section className="card-next rounded-3xl p-6">
              <h2 className="text-2xl font-semibold">Inscribir integrante a actividad</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Úsalo para box, videojuegos u otras actividades individuales.
              </p>

              <form action={registerMemberToEvent} className="mt-6 grid gap-4">
                <div>
                  <label className="mb-2 block text-sm text-muted-foreground">Actividad</label>
                  <select
                    name="eventId"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  >
                    <option value="">Selecciona actividad</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name} · {event.scoreCategory}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-muted-foreground">Integrante</label>
                  <select
                    name="memberId"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  >
                    <option value="">Selecciona integrante</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.fullName} · {member.team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-muted-foreground">Notas</label>
                  <textarea
                    name="notes"
                    rows={2}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                    placeholder="Opcional"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-sheen rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
                >
                  Registrar integrante
                </button>
              </form>
            </section>

            <section className="card-next rounded-3xl p-6">
              <h2 className="text-2xl font-semibold">Actividades e inscritos</h2>

              <div className="mt-6 grid gap-4">
                {events.length ? (
                  events.map((event) => (
                    <div key={event.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold">{event.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatDate(event.eventDate)} · {event.place}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
                            {statusLabel(event.status)}
                          </span>
                          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
                            {event.registrations.length}
                            {event.teamCapacity ? ` / ${event.teamCapacity}` : ""} registros
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {event.status !== EventStatus.ABIERTA ? (
                          <form action={updateEventStatus.bind(null, event.id, EventStatus.ABIERTA)}>
                            <button
                              type="submit"
                              className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              Abrir
                            </button>
                          </form>
                        ) : null}

                        {event.status !== EventStatus.CERRADA ? (
                          <form action={updateEventStatus.bind(null, event.id, EventStatus.CERRADA)}>
                            <button
                              type="submit"
                              className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              Cerrar
                            </button>
                          </form>
                        ) : null}

                        {event.status !== EventStatus.FINALIZADA ? (
                          <form action={updateEventStatus.bind(null, event.id, EventStatus.FINALIZADA)}>
                            <button
                              type="submit"
                              className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              Finalizar
                            </button>
                          </form>
                        ) : null}

                        <a
                          href={`/api/semana-cultural/export-event-registrations?eventId=${event.id}`}
                          className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Exportar inscritos
                        </a>
                      </div>

                      {event.registrations.length ? (
                        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                          <table className="w-full text-left">
                            <thead className="bg-white/5 text-xs text-muted-foreground">
                              <tr>
                                <th className="px-4 py-3">Equipo / integrante</th>
                                <th className="px-4 py-3">Unidad</th>
                                <th className="px-4 py-3">Check-in</th>
                                <th className="px-4 py-3">Notas</th>
                                <th className="px-4 py-3">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {event.registrations.map((registration) => (
                                <tr key={registration.id} className="border-t border-white/10">
                                  <td className="px-4 py-3 font-medium">
                                    {registration.member
                                      ? `${registration.member.fullName} · ${registration.team.name}`
                                      : registration.team.name}
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground">
                                    {registration.team.unidadAcademica}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
                                      {registration.checkedIn ? "Presente" : "Pendiente"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground">
                                    {registration.notes || "—"}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-2">
                                      <form
                                        action={toggleCheckIn.bind(
                                          null,
                                          registration.id,
                                          !registration.checkedIn
                                        )}
                                      >
                                        <button
                                          type="submit"
                                          className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                                        >
                                          {registration.checkedIn ? "Quitar check-in" : "Hacer check-in"}
                                        </button>
                                      </form>

                                      <form
                                        action={
                                          registration.memberId
                                            ? removeMemberFromEvent.bind(null, registration.id)
                                            : removeTeamFromEvent.bind(null, registration.id)
                                        }
                                      >
                                        <button
                                          type="submit"
                                          className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                                        >
                                          Eliminar
                                        </button>
                                      </form>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-muted-foreground">
                          Aún no hay equipos o integrantes inscritos en esta actividad.
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-muted-foreground">
                    Aún no hay actividades registradas.
                  </div>
                )}
              </div>
            </section>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
