"use server";

import { Prisma, TicketEventStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSessionUserInfo, requireAdmin } from "@/lib/auth";
import { slugifyTicketEvent } from "@/lib/tickets/format";

export type TicketAdminActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const INITIAL_STATE: TicketAdminActionState = {
  status: "idle",
  message: "",
};

function normalizeActionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.map((item) => String(item))
        : [];

      if (target.some((value) => value.includes("slug"))) {
        return "Ya existe un evento con ese slug.";
      }

      if (target.some((value) => value.includes("eventId")) && target.some((value) => value.includes("name"))) {
        return "Ese tipo de boleto ya existe para este evento.";
      }

      return "Conflicto de datos: revisa los campos e intenta de nuevo.";
    }

    if (error.code === "P2003") {
      return "No se encontro el evento asociado al tipo de boleto.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudo completar la operacion.";
}

function parsePositiveInteger(rawValue: string, fieldName: string) {
  const value = Number(rawValue);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} debe ser un numero entero mayor a cero.`);
  }
  return value;
}

function parseDecimalPrice(rawValue: string) {
  const normalized = rawValue.trim();
  if (!normalized) {
    throw new Error("El precio es obligatorio.");
  }

  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("El precio debe ser mayor a cero.");
  }

  return new Prisma.Decimal(value.toFixed(2));
}

function parseEventStatus(rawStatus: string) {
  const normalized = rawStatus.trim().toUpperCase();
  const validStatuses = new Set([
    TicketEventStatus.DRAFT,
    TicketEventStatus.PUBLISHED,
    TicketEventStatus.CLOSED,
    TicketEventStatus.CANCELLED,
  ]);

  if (!validStatuses.has(normalized as TicketEventStatus)) {
    throw new Error("Estado de evento invalido.");
  }

  return normalized as TicketEventStatus;
}

export async function createTicketEventWithState(
  _prevState: TicketAdminActionState = INITIAL_STATE,
  formData: FormData
): Promise<TicketAdminActionState> {
  void _prevState;
  try {
    const session = await requireAdmin();
    const actorId = getSessionUserInfo(session.user).id;

    const title = String(formData.get("title") || "").trim();
    const slugRaw = String(formData.get("slug") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const location = String(formData.get("location") || "").trim();
    const imageUrl = String(formData.get("imageUrl") || "").trim();
    const eventDateRaw = String(formData.get("eventDate") || "").trim();
    const statusRaw = String(formData.get("status") || TicketEventStatus.DRAFT).trim();

    if (!title || !location || !eventDateRaw) {
      throw new Error("Titulo, fecha y lugar son obligatorios.");
    }

    const slug = slugifyTicketEvent(slugRaw || title);
    if (!slug) {
      throw new Error("No se pudo generar un slug valido.");
    }

    const eventDate = new Date(eventDateRaw);
    if (Number.isNaN(eventDate.getTime())) {
      throw new Error("La fecha del evento no es valida.");
    }

    const status = parseEventStatus(statusRaw);

    const createdEvent = await db.ticketEvent.create({
      data: {
        title,
        slug,
        description: description || null,
        eventDate,
        location,
        imageUrl: imageUrl || null,
        status,
      },
      select: {
        id: true,
        title: true,
      },
    });

    await db.ticketAuditLog.create({
      data: {
        action: "CREATE_TICKET_EVENT",
        entityType: "TicketEvent",
        entityId: createdEvent.id,
        detail: `Evento ${createdEvent.title} creado por ${actorId ?? "sistema"}.`,
      },
    });

    revalidatePath("/tickets");
    revalidatePath("/tickets/eventos");
    revalidatePath(`/tickets/eventos/${createdEvent.id}`);
    revalidatePath("/tickets/admin");

    return {
      status: "success",
      message: "Evento creado correctamente.",
    };
  } catch (error) {
    return {
      status: "error",
      message: normalizeActionError(error),
    };
  }
}

export async function createTicketTypeWithState(
  _prevState: TicketAdminActionState = INITIAL_STATE,
  formData: FormData
): Promise<TicketAdminActionState> {
  void _prevState;
  try {
    const session = await requireAdmin();
    const actorId = getSessionUserInfo(session.user).id;

    const eventId = String(formData.get("eventId") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const priceRaw = String(formData.get("price") || "").trim();
    const quantityRaw = String(formData.get("quantity") || "").trim();
    const maxPerOrderRaw = String(formData.get("maxPerOrder") || "").trim();
    const isActive = String(formData.get("isActive") || "on") === "on";

    if (!eventId || !name) {
      throw new Error("Evento y nombre del boleto son obligatorios.");
    }

    const price = parseDecimalPrice(priceRaw);
    const quantity = parsePositiveInteger(quantityRaw, "Cantidad");
    const maxPerOrder = parsePositiveInteger(maxPerOrderRaw, "Maximo por orden");
    if (maxPerOrder > quantity) {
      throw new Error("Maximo por orden no puede ser mayor que la cantidad disponible.");
    }

    const event = await db.ticketEvent.findUnique({
      where: { id: eventId },
      select: { id: true, title: true },
    });
    if (!event) {
      throw new Error("El evento seleccionado no existe.");
    }

    const createdType = await db.ticketType.create({
      data: {
        eventId: event.id,
        name,
        description: description || null,
        price,
        quantity,
        maxPerOrder,
        isActive,
      },
      select: {
        id: true,
        name: true,
      },
    });

    await db.ticketAuditLog.create({
      data: {
        action: "CREATE_TICKET_TYPE",
        entityType: "TicketType",
        entityId: createdType.id,
        detail: `Tipo ${createdType.name} creado para ${event.title} por ${actorId ?? "sistema"}.`,
      },
    });

    revalidatePath("/tickets");
    revalidatePath("/tickets/eventos");
    revalidatePath(`/tickets/eventos/${event.id}`);
    revalidatePath("/tickets/admin");

    return {
      status: "success",
      message: "Tipo de boleto creado correctamente.",
    };
  } catch (error) {
    return {
      status: "error",
      message: normalizeActionError(error),
    };
  }
}
