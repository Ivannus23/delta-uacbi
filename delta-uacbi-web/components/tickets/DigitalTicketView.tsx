import { DigitalTicketStatus } from "@prisma/client";
import Link from "next/link";
import { formatTicketDate } from "@/lib/tickets/format";
import { getDigitalTicketQrPayload } from "@/lib/tickets/qr";
import { TicketQr } from "@/components/tickets/TicketQr";

type DigitalTicketViewProps = {
  ticket: {
    id: string;
    folio: string;
    qrToken: string;
    status: DigitalTicketStatus;
    createdAt: Date;
    event: {
      title: string;
      eventDate: Date;
      location: string;
    };
    ticketType: {
      name: string;
    };
    order: {
      buyerName: string;
      buyerEmail: string;
    };
  };
};

export async function DigitalTicketView({ ticket }: DigitalTicketViewProps) {
  const qrPayload = getDigitalTicketQrPayload(ticket.qrToken);

  return (
    <section className="card-next rounded-3xl p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Delta Tickets</p>
      <h1 className="mt-2 text-3xl font-semibold">Boleto digital</h1>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">Evento:</span> {ticket.event.title}
          </p>
          <p>
            <span className="font-semibold text-foreground">Fecha:</span> {formatTicketDate(ticket.event.eventDate)}
          </p>
          <p>
            <span className="font-semibold text-foreground">Ubicacion:</span> {ticket.event.location}
          </p>
          <p>
            <span className="font-semibold text-foreground">Comprador:</span> {ticket.order.buyerName}
          </p>
          <p>
            <span className="font-semibold text-foreground">Correo:</span> {ticket.order.buyerEmail}
          </p>
          <p>
            <span className="font-semibold text-foreground">Tipo de boleto:</span> {ticket.ticketType.name}
          </p>
          <p>
            <span className="font-semibold text-foreground">Folio:</span> {ticket.folio}
          </p>
          <p>
            <span className="font-semibold text-foreground">Estado:</span>{" "}
            {ticket.status === DigitalTicketStatus.VALID ? "VALIDO" : ticket.status}
          </p>
          <p>
            <span className="font-semibold text-foreground">Emitido:</span> {formatTicketDate(ticket.createdAt)}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/40 p-4">
          <TicketQr value={qrPayload} size={260} />
          <p className="mt-3 max-w-[260px] break-all text-xs text-muted-foreground">{qrPayload}</p>
          <Link
            href={`/tickets/validar/${encodeURIComponent(ticket.qrToken)}`}
            className="mt-3 inline-block text-xs text-muted-foreground underline hover:text-foreground"
          >
            Abrir validacion publica
          </Link>
        </div>
      </div>
    </section>
  );
}
