import { DigitalTicketStatus, Prisma, TicketScanResult } from "@prisma/client";
import { db } from "@/lib/db";
import { TicketDomainError } from "@/lib/tickets/orders";

export type TicketCheckinResult =
  | {
      status: "VALID";
      message: string;
      ticket: {
        id: string;
        qrToken: string;
        folio: string;
        eventTitle: string;
        ticketTypeName: string;
        buyerName: string;
        usedAt: Date | null;
      };
    }
  | {
      status: "USED";
      message: string;
      ticket: {
        id: string;
        qrToken: string;
        folio: string;
        eventTitle: string;
        ticketTypeName: string;
        buyerName: string;
        usedAt: Date | null;
      };
    }
  | {
      status: "CANCELLED";
      message: string;
      ticket: {
        id: string;
        qrToken: string;
        folio: string;
        eventTitle: string;
        ticketTypeName: string;
        buyerName: string;
        usedAt: Date | null;
      };
    }
  | {
      status: "NOT_FOUND";
      message: string;
      ticket: null;
    }
  | {
      status: "INVALID";
      message: string;
      ticket: null;
    };

function mapTicketInfo(
  ticket: Prisma.DigitalTicketGetPayload<{
    include: { event: true; ticketType: true; order: true };
  }>
) {
  return {
    id: ticket.id,
    qrToken: ticket.qrToken,
    folio: ticket.folio,
    eventTitle: ticket.event.title,
    ticketTypeName: ticket.ticketType.name,
    buyerName: ticket.order.buyerName,
    usedAt: ticket.usedAt,
  };
}

function isLikelyQrToken(value: string) {
  return /^[a-f0-9]{32,80}$/i.test(value);
}

async function createCheckinAuditLog(action: string, detail: string) {
  await db.ticketAuditLog.create({
    data: {
      action,
      entityType: "DigitalTicket",
      detail,
    },
  });
}

export async function getTicketValidationByQrToken(qrToken: string) {
  const token = qrToken.trim();
  if (!token || !isLikelyQrToken(token)) {
    return {
      status: "NOT_FOUND" as const,
      message: "Boleto no encontrado.",
      ticket: null,
    };
  }

  const ticket = await db.digitalTicket.findUnique({
    where: {
      qrToken: token,
    },
    include: {
      event: true,
      ticketType: true,
      order: true,
    },
  });

  if (!ticket) {
    return {
      status: "NOT_FOUND" as const,
      message: "Boleto no encontrado.",
      ticket: null,
    };
  }

  if (ticket.status === DigitalTicketStatus.CANCELLED) {
    return {
      status: "CANCELLED" as const,
      message: "Este boleto fue cancelado.",
      ticket: mapTicketInfo(ticket),
    };
  }

  if (ticket.status === DigitalTicketStatus.USED) {
    return {
      status: "USED" as const,
      message: "Este boleto ya fue utilizado.",
      ticket: mapTicketInfo(ticket),
    };
  }

  return {
    status: "VALID" as const,
    message: "Boleto valido para ingreso.",
    ticket: mapTicketInfo(ticket),
  };
}

export async function performTicketCheckinByQrToken(qrToken: string, scannedById: string | null) {
  const token = qrToken.trim();
  if (!token || !isLikelyQrToken(token)) {
    await createCheckinAuditLog("CHECKIN_INVALID_TOKEN", "Intento de check-in con token invalido.");
    return {
      status: "INVALID",
      message: "Token de boleto invalido.",
      ticket: null,
    } satisfies TicketCheckinResult;
  }

  const result = await db.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT id
      FROM "DigitalTicket"
      WHERE "qrToken" = ${token}
      FOR UPDATE
    `;

    const ticket = await tx.digitalTicket.findUnique({
      where: {
        qrToken: token,
      },
      include: {
        event: true,
        ticketType: true,
        order: true,
      },
    });

    if (!ticket) {
      return {
        status: "NOT_FOUND",
        message: "Boleto no encontrado.",
        ticket: null,
      } satisfies TicketCheckinResult;
    }

    if (ticket.status === DigitalTicketStatus.CANCELLED) {
      await tx.ticketScanLog.create({
        data: {
          ticketId: ticket.id,
          scannedById,
          result: TicketScanResult.CANCELLED,
          detail: "Intento de acceso con boleto cancelado.",
        },
      });

      return {
        status: "CANCELLED",
        message: "Este boleto fue cancelado.",
        ticket: mapTicketInfo(ticket),
      } satisfies TicketCheckinResult;
    }

    if (ticket.status === DigitalTicketStatus.USED) {
      await tx.ticketScanLog.create({
        data: {
          ticketId: ticket.id,
          scannedById,
          result: TicketScanResult.USED,
          detail: "Boleto previamente utilizado.",
        },
      });

      return {
        status: "USED",
        message: "Este boleto ya fue utilizado.",
        ticket: mapTicketInfo(ticket),
      } satisfies TicketCheckinResult;
    }

    const usedAt = new Date();
    const usedTicket = await tx.digitalTicket.update({
      where: { id: ticket.id },
      data: {
        status: DigitalTicketStatus.USED,
        usedAt,
      },
      include: {
        event: true,
        ticketType: true,
        order: true,
      },
    });

    await tx.ticketScanLog.create({
      data: {
        ticketId: ticket.id,
        scannedById,
        result: TicketScanResult.VALID,
        detail: "Ingreso validado y marcado como USED.",
      },
    });

    await tx.ticketAuditLog.create({
      data: {
        action: "CHECKIN_MARK_USED",
        entityType: "DigitalTicket",
        entityId: ticket.id,
        detail: `Ticket ${ticket.folio} usado en check-in.`,
      },
    });

    return {
      status: "VALID",
      message: "Ingreso validado.",
      ticket: mapTicketInfo(usedTicket),
    } satisfies TicketCheckinResult;
  });

  if (result.status === "NOT_FOUND") {
    await createCheckinAuditLog("CHECKIN_NOT_FOUND", "Intento de check-in con boleto no encontrado.");
  }

  return result;
}

export async function assertStaffCanCheckin(role: string | null) {
  if (role !== "ADMIN" && role !== "STAFF") {
    throw new TicketDomainError("No autorizado.");
  }
}
