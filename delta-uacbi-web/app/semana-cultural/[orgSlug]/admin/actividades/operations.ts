"use server";

import { createAuditLog } from "@/lib/audit";
import { requireOrgStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveEdition } from "@/lib/semana-cultural";
import { EventStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

function getActorIdFromSession(session: Awaited<ReturnType<typeof requireOrgStaff>>["session"]) {
  return session.user && typeof session.user === "object" && "id" in session.user && typeof session.user.id === "string"
    ? session.user.id
    : null;
}

export async function updateEventStatus(
  organizationId: string,
  orgSlug: string,
  eventId: string,
  status: EventStatus
) {
  const { session } = await requireOrgStaff(organizationId);
  const actorId = getActorIdFromSession(session);

  const edition = await getActiveEdition(organizationId);
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
    editionId: edition.id,
    createdById: actorId,
  });

  const base = `/semana-cultural/${orgSlug}`;
  revalidatePath(`${base}/admin/actividades`);
  revalidatePath(`${base}/admin/dashboard`);
  revalidatePath(`${base}/cronograma`);
  revalidatePath(`${base}/resultados`);
}

export async function toggleCheckIn(
  organizationId: string,
  orgSlug: string,
  registrationId: string,
  checkedIn: boolean
) {
  const { session } = await requireOrgStaff(organizationId);
  const actorId = getActorIdFromSession(session);

  const edition = await getActiveEdition(organizationId);
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
    editionId: edition.id,
    createdById: actorId,
  });

  const base = `/semana-cultural/${orgSlug}`;
  revalidatePath(`${base}/admin/actividades`);
  revalidatePath(`${base}/admin/dashboard`);
  revalidatePath(`${base}/equipos/${registration.team.id}`);
}
