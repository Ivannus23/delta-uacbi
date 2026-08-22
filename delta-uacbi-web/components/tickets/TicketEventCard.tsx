import { TicketEvent, TicketType } from "@prisma/client";
import { formatTicketDate, formatTicketMoney } from "@/lib/tickets/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type TicketEventWithTypes = TicketEvent & {
  ticketTypes: TicketType[];
};

type TicketEventCardProps = {
  event: TicketEventWithTypes;
};

export function TicketEventCard({ event }: TicketEventCardProps) {
  const lowestPrice = event.ticketTypes.length
    ? Math.min(...event.ticketTypes.map((item) => Number(item.price)))
    : null;

  return (
    <Card variant="surface" className="accent-tickets">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-2xl font-semibold">{event.title}</h3>
        <Badge variant="tickets">{event.status}</Badge>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">{event.description || "Sin descripcion."}</p>

      <div className="mt-5 grid gap-2 text-sm text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">Fecha:</span> {formatTicketDate(event.eventDate)}
        </p>
        <p>
          <span className="font-semibold text-foreground">Lugar:</span> {event.location}
        </p>
        <p>
          <span className="font-semibold text-foreground">Boletos activos:</span> {event.ticketTypes.length}
        </p>
        <p>
          <span className="font-semibold text-foreground">Desde:</span>{" "}
          {lowestPrice === null ? "Proximamente" : formatTicketMoney(lowestPrice)}
        </p>
      </div>

      <div className="mt-5">
        <Button href={`/tickets/eventos/${event.id}`} variant="outline" size="md">
          Ver evento
        </Button>
      </div>
    </Card>
  );
}
