import { DigitalTicketStatus, TicketOrderStatus } from "@prisma/client";
import { formatTicketDate, formatTicketMoney } from "@/lib/tickets/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type TicketOrderSummaryProps = {
  order: {
    id: string;
    publicToken: string;
    status: TicketOrderStatus;
    buyerName: string;
    buyerEmail: string;
    buyerPhone: string;
    totalAmount: number | { toString(): string };
    createdAt: Date;
    event: {
      id: string;
      title: string;
      eventDate: Date;
      location: string;
    };
    items: Array<{
      id: string;
      quantity: number;
      unitPrice: number | { toString(): string };
      subtotal: number | { toString(): string };
      ticketType: {
        id: string;
        name: string;
      };
    }>;
    digitalTickets: Array<{
      id: string;
      folio: string;
      status: DigitalTicketStatus;
      qrToken: string;
      ticketType: {
        id: string;
        name: string;
      };
    }>;
  };
};

function money(value: number | { toString(): string }) {
  return formatTicketMoney(Number(value));
}

export function TicketOrderSummary({ order }: TicketOrderSummaryProps) {
  return (
    <Card variant="surface" className="accent-tickets">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge variant="tickets" dot>Orden Delta Tickets</Badge>
          <h1 className="font-display mt-3 text-3xl font-semibold">Orden de compra</h1>
          <p className="mt-1 text-xs text-muted-foreground break-all">Token: {order.publicToken}</p>
          <p className="mt-2 text-sm text-muted-foreground">Creada el {formatTicketDate(order.createdAt)}</p>
        </div>
        <Badge variant="tickets">Estado: {order.status}</Badge>
      </div>

      <div className="mt-6 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
        <p>
          <span className="font-semibold text-foreground">Evento:</span> {order.event.title}
        </p>
        <p>
          <span className="font-semibold text-foreground">Fecha del evento:</span>{" "}
          {formatTicketDate(order.event.eventDate)}
        </p>
        <p>
          <span className="font-semibold text-foreground">Lugar:</span> {order.event.location}
        </p>
        <p>
          <span className="font-semibold text-foreground">Comprador:</span> {order.buyerName}
        </p>
        <p>
          <span className="font-semibold text-foreground">Correo:</span> {order.buyerEmail}
        </p>
        <p>
          <span className="font-semibold text-foreground">Telefono:</span> {order.buyerPhone}
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-sm text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Tipo de boleto</th>
              <th className="px-4 py-3">Cantidad</th>
              <th className="px-4 py-3">Precio unitario</th>
              <th className="px-4 py-3">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-t border-white/10">
                <td className="px-4 py-3 font-medium">{item.ticketType.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.quantity}</td>
                <td className="px-4 py-3 text-muted-foreground">{money(item.unitPrice)}</td>
                <td className="px-4 py-3 text-muted-foreground">{money(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-right text-lg font-semibold">Total: {money(order.totalAmount)}</p>

      {order.status === TicketOrderStatus.PAID ? (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Boletos emitidos</h2>
          <div className="mt-3 grid gap-3">
            {order.digitalTickets.length ? (
              order.digitalTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{ticket.ticketType.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Folio: {ticket.folio} | Estado: {ticket.status}
                    </p>
                  </div>
                  <Button href={`/tickets/boleto/${encodeURIComponent(ticket.qrToken)}`} variant="ghost" size="sm">
                    Ver boleto
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">La orden esta pagada pero no hay boletos emitidos.</p>
            )}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

