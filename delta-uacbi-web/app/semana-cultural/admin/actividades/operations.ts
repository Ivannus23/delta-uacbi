"use server";

import { createAuditLog } from "@/lib/audit";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveEdition } from "@/lib/semana-cultural";
import { EventStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

function getActorIdFromSession(session: Awaited<ReturnType<typeof requireStaff>>) {
  return session.user && typeof session.user === "object" && "id" in session.user && typeof session.user.id === "string"
    ? session.user.id
    : null;
}

export async function updateEventStatus(eventId: string, status: EventStatus) {
  const session = await requireStaff();
  const actorId = getActorIdFromSession(session);

  const edition = await getActiveEdition();
  if (!edition) {
    throw new Error("No hay una edición activa.");
  }

  const event = await db.event.findFirst({
    where: {
      id: eventId,
      editionId: edition.id,
    },
    select: {
      id: true,
      name: true,
      status: true,
    },
  });

  if (!event) {
    throw new Error("Actividad no encontrada.");
  }

  await db.event.update({
    where: { id: event.id },
    data: { status },
  });

  await createAuditLog({
    action: "UPDATE_EVENT_STATUS",
    entityType: "Event",
    entityId: event.id,
    detail: `La actividad ${event.name} cambió de ${event.status} a ${status}`,
    createdById: actorId,
  });

  revalidatePath("/semana-cultural/admin/actividades");
  revalidatePath("/semana-cultural/admin/dashboard");
  revalidatePath("/semana-cultural/cronograma");
  revalidatePath("/semana-cultural/resultados");
}

export async function toggleCheckIn(registrationId: string, checkedIn: boolean) {
  const session = await requireStaff();
  const actorId = getActorIdFromSession(session);

  const edition = await getActiveEdition();
  if (!edition) {
    throw new Error("No hay una edición activa.");
  }

  const registration = await db.eventRegistration.findFirst({
    where: {
      id: registrationId,
      event: {
        editionId: edition.id,
      },
    },
    include: {
      event: {
        select: {
          id: true,
          name: true,
        },
      },
      team: {
        select: {
          id: true,
          animal: true,
        },
      },
      member: {
        select: {
          fullName: true,
        },
      },
    },
  });

  if (!registration) {
    throw new Error("Registro no encontrado.");
  }

  await db.eventRegistration.update({
    where: { id: registration.id },
    data: { checkedIn },
  });

  await createAuditLog({
    action: checkedIn ? "CHECKIN_ON" : "CHECKIN_OFF",
    entityType: "EventRegistration",
    entityId: registration.id,
    detail: checkedIn
      ? `Check-in registrado para ${registration.member?.fullName ?? registration.team.animal} en ${registration.event.name}`
      : `Check-in removido para ${registration.member?.fullName ?? registration.team.animal} en ${registration.event.name}`,
    createdById: actorId,
  });

  revalidatePath("/semana-cultural/admin/actividades");
  revalidatePath("/semana-cultural/admin/dashboard");
  revalidatePath(`/semana-cultural/equipos/${registration.team.id}`);
}
