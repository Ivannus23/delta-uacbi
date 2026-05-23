import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { TicketEventCard } from "@/components/tickets/TicketEventCard";
import { getPublishedTicketEvents } from "@/lib/tickets/queries";

export const revalidate = 60;

export default async function TicketEventsPage() {
  const events = await getPublishedTicketEvents();

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <section className="card-next rounded-3xl p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Eventos publicos</p>
          <h1 className="mt-2 text-3xl font-semibold">Eventos disponibles en Delta Tickets</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Explora los eventos publicados y revisa los tipos de boleto disponibles para cada uno.
          </p>
          <div className="mt-5">
            <Link
              href="/tickets"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              Volver a Delta Tickets
            </Link>
          </div>
        </section>

        <section className="mt-8">
          {events.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {events.map((event) => (
                <TicketEventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="card-next rounded-3xl p-6 text-muted-foreground">
              No hay eventos publicados por el momento.
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
