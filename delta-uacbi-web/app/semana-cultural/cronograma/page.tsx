import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { getActiveEvents } from "@/lib/semana-cultural";

const DISPLAY_TIME_ZONE = "UTC";
const DEFAULT_EVENT_DURATION_HOURS = 1;

type EventItem = Awaited<ReturnType<typeof getActiveEvents>>[number];

type DaySchedule = {
  key: string;
  label: string;
  accent: string;
  hours: number[];
  events: Array<{
    event: EventItem;
    start: Date;
    end: Date;
    startColumn: number;
    span: number;
    lane: number;
  }>;
  laneCount: number;
};

const categoryStyles: Record<string, string> = {
  TOPACIO: "border-amber-200/60 bg-amber-100 text-amber-950",
  DIAMANTE: "border-sky-200/60 bg-sky-100 text-sky-950",
  ESMERALDA: "border-emerald-200/60 bg-emerald-100 text-emerald-950",
};

const accentStyles = [
  "bg-blue-700 text-white",
  "bg-cyan-700 text-white",
  "bg-orange-700 text-white",
  "bg-green-700 text-white",
  "bg-violet-800 text-white",
];

function getEventStart(event: EventItem) {
  return event.startTime ?? event.eventDate;
}

function getEventEnd(event: EventItem) {
  const start = getEventStart(event);
  return event.endTime ?? new Date(start.getTime() + DEFAULT_EVENT_DURATION_HOURS * 60 * 60 * 1000);
}

function formatDayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDayLabel(date: Date) {
  const formatted = new Intl.DateTimeFormat("es-MX", {
    timeZone: DISPLAY_TIME_ZONE,
    weekday: "long",
    day: "numeric",
  }).format(date);

  return formatted.replace(",", "").toUpperCase();
}

function formatTimeLabel(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: DISPLAY_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatHourHeader(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function getHourInTimeZone(date: Date) {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: DISPLAY_TIME_ZONE,
      hour: "numeric",
      hour12: false,
    }).format(date)
  );
}

function getMinuteInTimeZone(date: Date) {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: DISPLAY_TIME_ZONE,
      minute: "2-digit",
    }).format(date)
  );
}

function getGridStart(start: Date, minHour: number) {
  return Math.max(1, getHourInTimeZone(start) - minHour + 1);
}

function getGridSpan(start: Date, end: Date) {
  const startDecimal = getHourInTimeZone(start) + getMinuteInTimeZone(start) / 60;
  const endDecimal = getHourInTimeZone(end) + getMinuteInTimeZone(end) / 60;
  return Math.max(1, Math.ceil(endDecimal - startDecimal));
}

function buildSchedule(events: EventItem[]) {
  if (!events.length) {
    return { days: [] as DaySchedule[] };
  }

  const normalized = events.map((event) => {
    const start = getEventStart(event);
    const end = getEventEnd(event);

    return {
      event,
      start,
      end,
      key: formatDayKey(start),
    };
  });

  const dayMap = new Map<string, typeof normalized>();
  for (const item of normalized) {
    const current = dayMap.get(item.key) ?? [];
    current.push(item);
    dayMap.set(item.key, current);
  }

  const days = Array.from(dayMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, dayEvents], index) => {
      const sorted = [...dayEvents].sort((left, right) => left.start.getTime() - right.start.getTime());
      const lanes: Date[] = [];
      const minHour = Math.min(...sorted.map(({ start }) => getHourInTimeZone(start)));
      const maxHour = Math.max(
        ...sorted.map(
          ({ end }) => getHourInTimeZone(end) + (getMinuteInTimeZone(end) > 0 ? 1 : 0)
        )
      );
      const startHour = Math.max(0, minHour);
      const endHour = Math.max(startHour + 1, maxHour);
      const hours = Array.from({ length: endHour - startHour + 1 }, (_, hourIndex) => startHour + hourIndex);

      const positioned = sorted.map(({ event, start, end }) => {
        let lane = lanes.findIndex((lastEnd) => lastEnd.getTime() <= start.getTime());
        if (lane === -1) {
          lane = lanes.length;
          lanes.push(end);
        } else {
          lanes[lane] = end;
        }

        return {
          event,
          start,
          end,
          startColumn: getGridStart(start, startHour),
          span: getGridSpan(start, end),
          lane,
        };
      });

      return {
        key,
        label: formatDayLabel(sorted[0].start),
        accent: accentStyles[index % accentStyles.length],
        hours,
        events: positioned,
        laneCount: Math.max(1, lanes.length),
      };
    });

  return { days };
}

export default async function CronogramaPage() {
  const events = await getActiveEvents();
  const { days } = buildSchedule(events);

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana />

        <h1 className="text-3xl font-semibold">Cronograma</h1>
        <p className="mt-2 text-muted-foreground">
          Actividades programadas para la Semana Cultural UAE × UACBI.
        </p>

        {events.length ? (
          <>
            <section className="mt-8 lg:hidden">
              <div className="grid gap-4">
                {days.map((day, index) => (
                  <article key={day.key} className="card-next overflow-hidden rounded-3xl">
                    <div className="grid grid-cols-[72px_1fr] border-b border-white/10">
                      <div className={`flex items-center justify-center text-xl font-semibold ${day.accent}`}>
                        {index + 1}
                      </div>
                      <div className="bg-white/5 px-4 py-4">
                        <p className="text-sm font-semibold tracking-[0.08em] text-blue-100">{day.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {day.events.length} actividad{day.events.length === 1 ? "" : "es"}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 p-4">
                      {day.events.map(({ event, start, end }) => (
                        <article
                          key={event.id}
                          className={`rounded-2xl border p-4 ${categoryStyles[event.scoreCategory] ?? "border-white/15 bg-white/10 text-white"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-base font-semibold">{event.name}</p>
                              <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] opacity-75">
                                {formatTimeLabel(start)} - {formatTimeLabel(end)}
                              </p>
                            </div>

                            <span className="rounded-full border border-current/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
                              {event.scoreCategory}
                            </span>
                          </div>

                          <p className="mt-3 text-sm font-medium opacity-80">{event.place}</p>
                          {event.description ? (
                            <p className="mt-2 text-sm leading-relaxed opacity-80">{event.description}</p>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-8 hidden lg:block">
              <div className="grid gap-6">
                {days.map((day, index) => {
                  const timelineColumns = `repeat(${day.hours.length}, minmax(84px, 1fr))`;

                  return (
                    <div key={day.key} className="card-next overflow-hidden rounded-[2rem]">
                      <div className="grid grid-cols-[72px_220px_minmax(0,1fr)] border-b border-white/10 bg-[#7a5bc4] text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-950">
                        <div className="border-r border-black/10 px-3 py-4 text-center">#</div>
                        <div className="border-r border-black/10 bg-white/80 px-4 py-4 text-center">Hora</div>
                        <div className="grid bg-[#cfc9e4]" style={{ gridTemplateColumns: timelineColumns }}>
                          {day.hours.map((hour) => (
                            <div
                              key={`${day.key}-${hour}`}
                              className="border-r border-black/10 px-3 py-4 text-center last:border-r-0"
                            >
                              {formatHourHeader(hour)}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-[72px_220px_minmax(0,1fr)]">
                        <div className={`flex items-center justify-center text-xl font-semibold ${day.accent}`}>
                          {index + 1}
                        </div>

                        <div className="border-r border-white/10 bg-white px-5 py-6 text-slate-900">
                          <p className="text-lg font-semibold text-blue-900">{day.label}</p>
                          <p className="mt-2 text-sm text-slate-600">
                            {day.events.length} actividad{day.events.length === 1 ? "" : "es"}
                          </p>
                        </div>

                        <div className="relative overflow-x-auto bg-[#f6f4fb]">
                          <div
                            className="absolute inset-0 grid"
                            style={{ gridTemplateColumns: timelineColumns }}
                          >
                            {day.hours.map((hour) => (
                              <div
                                key={`${day.key}-grid-${hour}`}
                                className="border-r border-[#d9d3ea] last:border-r-0"
                              />
                            ))}
                          </div>

                          <div
                            className="relative grid gap-2 p-2"
                            style={{
                              gridTemplateColumns: timelineColumns,
                              gridTemplateRows: `repeat(${day.laneCount}, minmax(120px, auto))`,
                            }}
                          >
                            {day.events.map(({ event, start, end, startColumn, span, lane }) => (
                              <article
                                key={event.id}
                                className={`rounded-[1.25rem] border p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ${categoryStyles[event.scoreCategory] ?? "border-white/15 bg-white/10 text-white"}`}
                                style={{
                                  gridColumn: `${startColumn} / span ${span}`,
                                  gridRow: `${lane + 1}`,
                                }}
                              >
                                <div className="flex h-full flex-col">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold uppercase tracking-[0.14em] opacity-70">
                                        {formatTimeLabel(start)} - {formatTimeLabel(end)}
                                      </p>
                                      <h2 className="mt-2 text-lg font-semibold leading-tight">{event.name}</h2>
                                    </div>

                                    <span className="rounded-full border border-current/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
                                      {event.scoreCategory}
                                    </span>
                                  </div>

                                  <p className="mt-4 text-sm font-medium opacity-80">{event.place}</p>
                                  {event.description ? (
                                    <p className="mt-2 text-sm leading-relaxed opacity-75">{event.description}</p>
                                  ) : null}
                                </div>
                              </article>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          <div className="card-next mt-8 rounded-2xl p-6">
            <p className="text-muted-foreground">No hay actividades cargadas todavía.</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
