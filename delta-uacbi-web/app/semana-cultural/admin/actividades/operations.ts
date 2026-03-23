"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { EventStatus } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";

export async function updateEventStatus(eventId: string, status: EventStatus) {
  await db.event.update({
    where: { id: eventId },
    data: { status },
  });

  await createAuditLog({
    action: "UPDATE_EVENT_STATUS",
    entityType: "Event",
    entityId: eventId,
    detail: `La actividad cambió a estado ${status}`,
  });

  revalidatePath("/semana-cultural/admin/actividades");
  revalidatePath("/semana-cultural/cronograma");
}

export async function toggleCheckIn(registrationId: string, checkedIn: boolean) {
  await db.eventRegistration.update({
    where: { id: registrationId },
    data: { checkedIn },
  });

  await createAuditLog({
    action: checkedIn ? "CHECKIN_ON" : "CHECKIN_OFF",
    entityType: "EventRegistration",
    entityId: registrationId,
    detail: checkedIn ? "Se registró check-in" : "Se removió check-in",
  });

  revalidatePath("/semana-cultural/admin/actividades");
}
