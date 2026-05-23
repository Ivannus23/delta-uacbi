import { db } from "@/lib/db";

function escapeCsv(value: string | number | null | undefined) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(values: Array<string | number | null | undefined>) {
  return values.map(escapeCsv).join(",");
}

export async function buildOrdersCsv() {
  const orders = await db.ticketOrder.findMany({
    include: {
      event: true,
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const headers = ["Evento", "Comprador", "Correo", "Telefono", "Total", "Estado", "Fecha"];
  const rows = orders.map((order) =>
    row([
      order.event.title,
      order.buyerName,
      order.buyerEmail,
      order.buyerPhone,
      Number(order.totalAmount).toFixed(2),
      order.status,
      order.createdAt.toISOString(),
    ])
  );

  return [headers.join(","), ...rows].join("\n");
}

export async function buildTicketsCsv() {
  const tickets = await db.digitalTicket.findMany({
    include: {
      event: true,
      ticketType: true,
      order: true,
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const headers = ["Evento", "Folio", "TipoBoleto", "Estado", "UsadoEn", "Comprador", "Correo", "Telefono"];
  const rows = tickets.map((ticket) =>
    row([
      ticket.event.title,
      ticket.folio,
      ticket.ticketType.name,
      ticket.status,
      ticket.usedAt ? ticket.usedAt.toISOString() : "",
      ticket.order.buyerName,
      ticket.order.buyerEmail,
      ticket.order.buyerPhone,
    ])
  );

  return [headers.join(","), ...rows].join("\n");
}

export async function buildEventAttendeesCsv(eventId: string) {
  const event = await db.ticketEvent.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      slug: true,
    },
  });

  if (!event) {
    return null;
  }

  const tickets = await db.digitalTicket.findMany({
    where: { eventId: event.id },
    include: {
      ticketType: true,
      order: true,
    },
    orderBy: [{ createdAt: "asc" }],
  });

  const headers = ["Folio", "TipoBoleto", "Comprador", "EstadoCheckIn", "HoraEntrada"];
  const rows = tickets.map((ticket) =>
    row([
      ticket.folio,
      ticket.ticketType.name,
      ticket.order.buyerName,
      ticket.status,
      ticket.usedAt ? ticket.usedAt.toISOString() : "",
    ])
  );

  return {
    event,
    csv: [headers.join(","), ...rows].join("\n"),
  };
}
