import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { getActiveEvents } from "@/lib/semana-cultural";

const DISPLAY_TIME_ZONE = "America/Mazatlan";
const LEGACY_EVENT_FALLBACK_DURATION_MINUTES = 60;
const GRID_STEP_MINUTES = 30;

type EventItem = Awaited<ReturnType<typeof getActiveEvents>>[number];

type DaySchedule = {
  key: string;
  label: string;
  accent: string;
  slots: number[];
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
const nonScoredStyle = "border-slate-200/70 bg-slate-100 text-slate-900";
const fallbackScoredStyle = "border-white/15 bg-white/10 text-white";

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
  if (event.endTime && event.endTime.getTime() > start.getTime()) {
    return event.endTime;
  }
  return new Date(start.getTime() + LEGACY_EVENT_FALLBACK_DURATION_MINUTES * 60 * 1000);
}

function getEventBadgeLabel(event: EventItem) {
  if (!event.isScored) return "Solo cronograma";
  return event.scoreCategory ?? "Sin categoría";
}

function getEventStyle(event: EventItem) {
  if (!event.isScored) return nonScoredStyle;
  if (!event.scoreCategory) return fallbackScoredStyle;
  return categoryStyles[event.scoreCategory] ?? fallbackScoredStyle;
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

function formatSlotHeader(minuteOfDay: number) {
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
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

function getMinuteOfDayInTimeZone(date: Date) {
  return getHourInTimeZone(date) * 60 + getMinuteInTimeZone(date);
}

function getGridStart(start: Date, minMinute: number) {
  return Math.max(1, Math.floor((getMinuteOfDayInTimeZone(start) - minMinute) / GRID_STEP_MINUTES) + 1);
}

function getGridSpan(start: Date, end: Date) {
  const startMinute = getMinuteOfDayInTimeZone(start);
  const endMinute = getMinuteOfDayInTimeZone(end);
  return Math.max(1, Math.ceil((endMinute - startMinute) / GRID_STEP_MINUTES));
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
      const minMinute = Math.min(...sorted.map(({ start }) => getMinuteOfDayInTimeZone(start)));
      const maxMinute = Math.max(...sorted.map(({ end }) => getMinuteOfDayInTimeZone(end)));
      const startMinute = Math.floor(minMinute / GRID_STEP_MINUTES) * GRID_STEP_MINUTES;
      const endMinute = Math.max(
        startMinute + GRID_STEP_MINUTES,
        Math.ceil(maxMinute / GRID_STEP_MINUTES) * GRID_STEP_MINUTES
      );
      const slots = Array.from(
        { length: Math.max(1, (endMinute - startMinute) / GRID_STEP_MINUTES) },
        (_, slotIndex) => startMinute + slotIndex * GRID_STEP_MINUTES
      );

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
          startColumn: getGridStart(start, startMinute),
          span: getGridSpan(start, end),
          lane,
        };
      });

      return {
        key,
        label: formatDayLabel(sorted[0].start),
        accent: accentStyles[index % accentStyles.length],
        slots,
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
                          className={`rounded-2xl border p-4 ${getEventStyle(event)}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-base font-semibold">{event.name}</p>
                              <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] opacity-75">
                                {formatTimeLabel(start)} - {formatTimeLabel(end)}
                              </p>
                            </div>

                            <span className="rounded-full border border-current/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
                              {getEventBadgeLabel(event)}
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
                  const timelineColumns = `repeat(${day.slots.length}, minmax(84px, 1fr))`;

                  return (
                    <div key={day.key} className="card-next overflow-hidden rounded-[2rem]">
                      <div className="grid grid-cols-[72px_220px_minmax(0,1fr)] border-b border-white/10 bg-[#7a5bc4] text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-950">
                        <div className="border-r border-black/10 px-3 py-4 text-center">#</div>
                        <div className="border-r border-black/10 bg-white/80 px-4 py-4 text-center">Hora</div>
                        <div className="grid bg-[#cfc9e4]" style={{ gridTemplateColumns: timelineColumns }}>
                          {day.slots.map((slotMinute) => (
                            <div
                              key={`${day.key}-${slotMinute}`}
                              className="border-r border-black/10 px-3 py-4 text-center last:border-r-0"
                            >
                              {formatSlotHeader(slotMinute)}
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
                            {day.slots.map((slotMinute) => (
                              <div
                                key={`${day.key}-grid-${slotMinute}`}
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
                                className={`rounded-[1.25rem] border p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ${getEventStyle(event)}`}
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
                                      {getEventBadgeLabel(event)}
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
