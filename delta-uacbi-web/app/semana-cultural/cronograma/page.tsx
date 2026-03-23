import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { getActiveEvents } from "@/lib/semana-cultural";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function CronogramaPage() {
  const events = await getActiveEvents();

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana />

        <h1 className="text-3xl font-semibold">Cronograma</h1>
        <p className="mt-2 text-muted-foreground">
          Actividades programadas para la Semana Cultural UAE × UACBI.
        </p>

        <div className="mt-8 grid gap-4">
          {events.length ? (
            events.map((event) => (
              <div key={event.id} className="card-next rounded-2xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{event.name}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatDate(event.eventDate)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {event.place}
                    </p>
                  </div>

                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
                    {event.scoreCategory}
                  </span>
                </div>

                {event.description ? (
                  <p className="mt-4 text-sm text-muted-foreground">{event.description}</p>
                ) : null}
              </div>
            ))
          ) : (
            <div className="card-next rounded-2xl p-6">
              <p className="text-muted-foreground">No hay actividades cargadas todavía.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
