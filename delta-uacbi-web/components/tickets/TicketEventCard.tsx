import Link from "next/link";
import { TicketEvent, TicketType } from "@prisma/client";
import { formatTicketDate, formatTicketMoney } from "@/lib/tickets/format";

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
    <article className="card-next rounded-3xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-2xl font-semibold">{event.title}</h3>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
          {event.status}
        </span>
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
        <Link
          href={`/tickets/eventos/${event.id}`}
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
        >
          Ver evento
        </Link>
      </div>
    </article>
  );
}
