import { TicketEventStatus } from "@prisma/client";
import { db } from "@/lib/db";

export async function getPublishedTicketEvents() {
  return db.ticketEvent.findMany({
    where: {
      status: TicketEventStatus.PUBLISHED,
    },
    include: {
      ticketTypes: {
        where: { isActive: true },
        orderBy: [{ price: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: [{ eventDate: "asc" }, { title: "asc" }],
  });
}

export async function getPublicTicketEventById(eventId: string) {
  return db.ticketEvent.findFirst({
    where: {
      id: eventId,
      status: TicketEventStatus.PUBLISHED,
    },
    include: {
      ticketTypes: {
        where: { isActive: true },
        orderBy: [{ price: "asc" }, { createdAt: "asc" }],
      },
    },
  });
}
