import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { TicketEventCard } from "@/components/tickets/TicketEventCard";
import { getPublishedTicketEvents } from "@/lib/tickets/queries";

export const revalidate = 60;

export default async function TicketsHomePage() {
  const events = await getPublishedTicketEvents();
  const featuredEvents = events.slice(0, 3);

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <section className="card-next rounded-3xl p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Delta Tickets</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Boletos digitales para eventos Delta</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Delta Tickets es el nuevo modulo para publicar eventos, administrar accesos y centralizar la venta de
            boletos dentro de Delta UACBI.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/tickets/eventos"
              className="btn-sheen rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
            >
              Ver eventos disponibles
            </Link>
            <Link
              href="/tickets/admin"
              className="rounded-full border border-white/10 px-5 py-3 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              Panel Delta Tickets
            </Link>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">Eventos destacados</h2>
            <Link href="/tickets/eventos" className="text-sm text-muted-foreground hover:text-foreground">
              Ver todos
            </Link>
          </div>

          {featuredEvents.length ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {featuredEvents.map((event) => (
                <TicketEventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="card-next rounded-3xl p-6 text-muted-foreground">
              Todavia no hay eventos publicados en Delta Tickets.
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
