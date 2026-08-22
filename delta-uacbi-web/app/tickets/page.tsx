import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { TicketEventCard } from "@/components/tickets/TicketEventCard";
import { getPublishedTicketEvents } from "@/lib/tickets/queries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const revalidate = 60;

export default async function TicketsHomePage() {
  const events = await getPublishedTicketEvents();
  const featuredEvents = events.slice(0, 3);

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <Card variant="surface" className="accent-tickets">
          <Badge variant="tickets" dot>Delta Tickets</Badge>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight">Boletos digitales para eventos Delta</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Delta Tickets es el nuevo modulo para publicar eventos, administrar accesos y centralizar la venta de
            boletos dentro de Delta UACBI.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/tickets/eventos" variant="primary" size="lg">
              Ver eventos disponibles
            </Button>
            <Button href="/tickets/admin" variant="outline" size="lg">
              Panel Delta Tickets
            </Button>
          </div>
        </Card>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold">Eventos destacados</h2>
            <Button href="/tickets/eventos" variant="ghost" size="sm">
              Ver todos
            </Button>
          </div>

          {featuredEvents.length ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {featuredEvents.map((event) => (
                <TicketEventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card variant="surface" className="accent-tickets text-muted-foreground">
              Todavia no hay eventos publicados en Delta Tickets.
            </Card>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
