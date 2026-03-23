"use server";

import { db } from "@/lib/db";
import { getActiveEdition } from "@/lib/semana-cultural";
import { EventStatus, EventType, ScoreCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";

export async function createEvent(formData: FormData) {
  const edition = await getActiveEdition();
  if (!edition) throw new Error("No hay una edición activa.");

  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const type = String(formData.get("type") || "").trim() as EventType;
  const scoreCategory = String(formData.get("scoreCategory") || "").trim() as ScoreCategory;
  const place = String(formData.get("place") || "").trim();
  const eventDate = String(formData.get("eventDate") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const teamCapacityRaw = String(formData.get("teamCapacity") || "").trim();
  const memberCapacityRaw = String(formData.get("memberCapacity") || "").trim();

  if (!name || !slug || !type || !scoreCategory || !place || !eventDate) {
    throw new Error("Faltan campos obligatorios.");
  }

  const teamCapacity = teamCapacityRaw ? Number(teamCapacityRaw) : null;
  const memberCapacity = memberCapacityRaw ? Number(memberCapacityRaw) : null;

  await db.event.create({
    data: {
      editionId: edition.id,
      name,
      slug,
      type,
      scoreCategory,
      place,
      eventDate: new Date(eventDate),
      description: description || null,
      teamCapacity,
      memberCapacity,
      status: EventStatus.ABIERTA,
      isVisible: true,
    },
  });

  await createAuditLog({
    action: "CREATE_EVENT",
    entityType: "Event",
    detail: `Se creó la actividad ${name}`,
  });

  revalidatePath("/semana-cultural/cronograma");
  revalidatePath("/semana-cultural/admin/actividades");
}

export async function registerTeamToEvent(formData: FormData) {
  const edition = await getActiveEdition();
  if (!edition) throw new Error("No hay una edición activa.");

  const eventId = String(formData.get("eventId") || "").trim();
  const teamId = String(formData.get("teamId") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!eventId || !teamId) {
    throw new Error("Faltan datos para registrar al equipo.");
  }

  const event = await db.event.findFirst({
    where: {
      id: eventId,
      editionId: edition.id,
    },
    include: {
      registrations: true,
    },
  });

  if (!event) throw new Error("Actividad no encontrada.");

  const team = await db.team.findFirst({
    where: {
      id: teamId,
      editionId: edition.id,
    },
  });

  if (!team) throw new Error("Equipo no encontrado.");

  const existing = await db.eventRegistration.findFirst({
    where: {
      eventId,
      teamId,
      memberId: null,
    },
  });

  if (existing) {
    throw new Error("Este equipo ya está registrado en esta actividad.");
  }

  if (event.teamCapacity && event.registrations.length >= event.teamCapacity) {
    throw new Error("La actividad ya alcanzó su cupo máximo de equipos.");
  }

  await db.eventRegistration.create({
    data: {
      eventId,
      teamId,
      notes: notes || null,
      status: "APROBADA",
    },
  });

  await createAuditLog({
    action: "REGISTER_TEAM_TO_EVENT",
    entityType: "EventRegistration",
    detail: `Se registró el equipo ${team.name} en ${event.name}`,
  });

  revalidatePath("/semana-cultural/admin/actividades");
}

export async function removeTeamFromEvent(registrationId: string) {
  await db.eventRegistration.delete({
    where: { id: registrationId },
  });

  revalidatePath("/semana-cultural/admin/actividades");
}

export async function registerMemberToEvent(formData: FormData) {
  const edition = await getActiveEdition();
  if (!edition) throw new Error("No hay una edición activa.");

  const eventId = String(formData.get("eventId") || "").trim();
  const memberId = String(formData.get("memberId") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!eventId || !memberId) {
    throw new Error("Faltan datos para registrar al integrante.");
  }

  const event = await db.event.findFirst({
    where: {
      id: eventId,
      editionId: edition.id,
    },
    include: {
      registrations: true,
    },
  });

  if (!event) throw new Error("Actividad no encontrada.");

  const member = await db.member.findFirst({
    where: {
      id: memberId,
      team: {
        editionId: edition.id,
        status: "APROBADO",
      },
    },
    include: {
      team: true,
    },
  });

  if (!member) throw new Error("Integrante no encontrado.");

  const existing = await db.eventRegistration.findFirst({
    where: {
      eventId,
      memberId,
    },
  });

  if (existing) {
    throw new Error("Este integrante ya está registrado en esta actividad.");
  }

  if (event.memberCapacity) {
    const memberRegs = event.registrations.filter((r) => r.memberId !== null);
    if (memberRegs.length >= event.memberCapacity) {
      throw new Error("La actividad ya alcanzó su cupo máximo de integrantes.");
    }
  }

  await db.eventRegistration.create({
    data: {
      eventId,
      teamId: member.teamId,
      memberId: member.id,
      notes: notes || null,
      status: "APROBADA",
    },
  });

  await createAuditLog({
    action: "REGISTER_MEMBER_TO_EVENT",
    entityType: "EventRegistration",
    detail: `Se registró a ${member.fullName} en ${event.name}`,
  });

  revalidatePath("/semana-cultural/admin/actividades");
}

export async function removeMemberFromEvent(registrationId: string) {
  await db.eventRegistration.delete({
    where: { id: registrationId },
  });

  revalidatePath("/semana-cultural/admin/actividades");
}
