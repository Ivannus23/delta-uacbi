"use server";

import { createAuditLog } from "@/lib/audit";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveEdition } from "@/lib/semana-cultural";
import {
  EventStatus,
  EventType,
  Prisma,
  RegistrationStatus,
  ScoreCategory,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

const EVENT_TIME_ZONE = "America/Mazatlan";

function getActorIdFromSession(session: Awaited<ReturnType<typeof requireStaff>>) {
  return session.user &&
    typeof session.user === "object" &&
    "id" in session.user &&
    typeof session.user.id === "string"
    ? session.user.id
    : null;
}

function ensureValidEnum<T extends string>(
  value: string,
  values: readonly T[],
  errorMessage: string
): T {
  if (!values.includes(value as T)) {
    throw new Error(errorMessage);
  }
  return value as T;
}

function getTimeZoneOffsetMilliseconds(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return asUTC - date.getTime();
}

function parseDateTimeLocalInTimeZone(rawValue: string, timeZone: string) {
  const match = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    throw new Error("La fecha y hora no tiene un formato válido.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? "0");

  let timestamp = Date.UTC(year, month - 1, day, hour, minute, second);

  for (let index = 0; index < 2; index += 1) {
    const offset = getTimeZoneOffsetMilliseconds(new Date(timestamp), timeZone);
    timestamp = Date.UTC(year, month - 1, day, hour, minute, second) - offset;
  }

  return new Date(timestamp);
}

function parseOptionalCapacity(rawValue: string, label: string) {
  if (!rawValue) return null;
  const numeric = Number(rawValue);

  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new Error(`El campo ${label} debe ser un entero mayor a cero.`);
  }

  return numeric;
}

function revalidateActivityPaths(teamId?: string) {
  revalidatePath("/semana-cultural/admin/actividades");
  revalidatePath("/semana-cultural/admin/dashboard");
  revalidatePath("/semana-cultural/cronograma");
  revalidatePath("/semana-cultural/resultados");
  revalidatePath("/semana-cultural/ranking");
  if (teamId) {
    revalidatePath(`/semana-cultural/equipos/${teamId}`);
  }
}

function normalizePrismaRegistrationError(error: Prisma.PrismaClientKnownRequestError) {
  if (error.code !== "P2002") {
    return new Error("No se pudo completar la inscripción. Inténtalo nuevamente.");
  }

  const target = Array.isArray(error.meta?.target)
    ? error.meta.target.map((value) => String(value))
    : [];

  if (
    target.some((value) => value.includes("teamRegistrationKey")) ||
    target.some((value) =>
      value.includes("EventRegistration_event_team_unique_when_member_null_idx")
    )
  ) {
    return new Error("Este equipo ya está registrado en esta actividad.");
  }

  if (
    target.some((value) => value.includes("memberRegistrationKey")) ||
    target.some((value) =>
      value.includes("EventRegistration_event_member_unique_when_member_not_null_idx")
    )
  ) {
    return new Error("Este integrante ya está registrado en esta actividad.");
  }

  return new Error("No se pudo completar la inscripción por conflicto de datos.");
}

export async function createEvent(formData: FormData) {
  const session = await requireStaff();
  const actorId = getActorIdFromSession(session);

  const edition = await getActiveEdition();
  if (!edition) throw new Error("No hay una edición activa.");

  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  const typeRaw = String(formData.get("type") || "").trim();
  const scoreCategoryRaw = String(formData.get("scoreCategory") || "").trim();
  const place = String(formData.get("place") || "").trim();
  const eventDateRaw = String(formData.get("eventDate") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const teamCapacityRaw = String(formData.get("teamCapacity") || "").trim();
  const memberCapacityRaw = String(formData.get("memberCapacity") || "").trim();

  if (!name || !slug || !typeRaw || !scoreCategoryRaw || !place || !eventDateRaw) {
    throw new Error("Faltan campos obligatorios.");
  }

  const type = ensureValidEnum(typeRaw, Object.values(EventType), "Tipo de actividad inválido.");
  const scoreCategory = ensureValidEnum(
    scoreCategoryRaw,
    Object.values(ScoreCategory),
    "Categoría de puntos inválida."
  );

  const teamCapacity = parseOptionalCapacity(teamCapacityRaw, "Cupo de equipos");
  const memberCapacity = parseOptionalCapacity(memberCapacityRaw, "Cupo de integrantes");

  const eventDate = parseDateTimeLocalInTimeZone(eventDateRaw, EVENT_TIME_ZONE);

  try {
    const event = await db.event.create({
      data: {
        editionId: edition.id,
        name,
        slug,
        type,
        scoreCategory,
        place,
        eventDate,
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
      entityId: event.id,
      detail: `Se creó la actividad ${event.name}`,
      createdById: actorId,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = Array.isArray(error.meta?.target)
          ? error.meta.target.map((value) => String(value))
          : [];
        if (
          target.some((value) => value.includes("editionId")) &&
          target.some((value) => value.includes("slug"))
        ) {
          throw new Error("Ya existe una actividad con ese slug en esta edición.");
        }
      }
      throw new Error("No se pudo crear la actividad. Inténtalo nuevamente.");
    }

    if (error instanceof Error) throw error;
    throw new Error("No se pudo crear la actividad. Inténtalo nuevamente.");
  }

  revalidateActivityPaths();
}

export async function registerTeamToEvent(formData: FormData) {
  const session = await requireStaff();
  const actorId = getActorIdFromSession(session);

  const edition = await getActiveEdition();
  if (!edition) throw new Error("No hay una edición activa.");

  const eventId = String(formData.get("eventId") || "").trim();
  const teamId = String(formData.get("teamId") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!eventId || !teamId) {
    throw new Error("Faltan datos para registrar al equipo.");
  }

  try {
    const result = await db.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id
        FROM "Event"
        WHERE id = ${eventId} AND "editionId" = ${edition.id}
        FOR UPDATE
      `;

      const event = await tx.event.findFirst({
        where: {
          id: eventId,
          editionId: edition.id,
        },
        select: {
          id: true,
          name: true,
          status: true,
          teamCapacity: true,
        },
      });

      if (!event) throw new Error("Actividad no encontrada.");
      if (event.status !== EventStatus.ABIERTA) {
        throw new Error("No puedes registrar equipos porque la actividad está cerrada.");
      }

      const team = await tx.team.findFirst({
        where: {
          id: teamId,
          editionId: edition.id,
          status: "APROBADO",
        },
        select: {
          id: true,
          animal: true,
        },
      });

      if (!team) {
        throw new Error("Equipo no encontrado o no aprobado para competir.");
      }

      if (event.teamCapacity) {
        const currentTeams = await tx.eventRegistration.count({
          where: {
            eventId: event.id,
            memberId: null,
          },
        });

        if (currentTeams >= event.teamCapacity) {
          throw new Error("La actividad ya alcanzó su cupo máximo de equipos.");
        }
      }

      const teamRegistrationKey = `${event.id}:${team.id}`;
      const registration = await tx.eventRegistration.create({
        data: {
          eventId: event.id,
          teamId: team.id,
          notes: notes || null,
          status: RegistrationStatus.APROBADA,
          teamRegistrationKey,
          memberRegistrationKey: null,
        },
      });

      return {
        eventName: event.name,
        teamName: team.animal,
        teamId: team.id,
        registrationId: registration.id,
      };
    });

    await createAuditLog({
      action: "REGISTER_TEAM_TO_EVENT",
      entityType: "EventRegistration",
      entityId: result.registrationId,
      detail: `Se registró el equipo ${result.teamName} en ${result.eventName}`,
      createdById: actorId,
    });

    revalidateActivityPaths(result.teamId);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw normalizePrismaRegistrationError(error);
    }
    if (error instanceof Error) throw error;
    throw new Error("No se pudo registrar al equipo en la actividad.");
  }
}

export async function removeTeamFromEvent(registrationId: string) {
  const session = await requireStaff();
  const actorId = getActorIdFromSession(session);

  const edition = await getActiveEdition();
  if (!edition) throw new Error("No hay una edición activa.");

  const result = await db.$transaction(async (tx) => {
    const registration = await tx.eventRegistration.findFirst({
      where: {
        id: registrationId,
        memberId: null,
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
      },
    });

    if (!registration) {
      throw new Error("Registro de equipo no encontrado.");
    }

    await tx.eventRegistration.delete({
      where: { id: registration.id },
    });

    return {
      registrationId: registration.id,
      eventName: registration.event.name,
      teamName: registration.team.animal,
      teamId: registration.team.id,
    };
  });

  await createAuditLog({
    action: "REMOVE_TEAM_FROM_EVENT",
    entityType: "EventRegistration",
    entityId: result.registrationId,
    detail: `Se eliminó la inscripción de ${result.teamName} en ${result.eventName}`,
    createdById: actorId,
  });

  revalidateActivityPaths(result.teamId);
}

export async function registerMemberToEvent(formData: FormData) {
  const session = await requireStaff();
  const actorId = getActorIdFromSession(session);

  const edition = await getActiveEdition();
  if (!edition) throw new Error("No hay una edición activa.");

  const eventId = String(formData.get("eventId") || "").trim();
  const memberId = String(formData.get("memberId") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!eventId || !memberId) {
    throw new Error("Faltan datos para registrar al integrante.");
  }

  try {
    const result = await db.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id
        FROM "Event"
        WHERE id = ${eventId} AND "editionId" = ${edition.id}
        FOR UPDATE
      `;

      const event = await tx.event.findFirst({
        where: {
          id: eventId,
          editionId: edition.id,
        },
        select: {
          id: true,
          name: true,
          status: true,
          memberCapacity: true,
        },
      });

      if (!event) throw new Error("Actividad no encontrada.");
      if (event.status !== EventStatus.ABIERTA) {
        throw new Error("No puedes registrar integrantes porque la actividad está cerrada.");
      }

      const member = await tx.member.findFirst({
        where: {
          id: memberId,
          team: {
            editionId: edition.id,
            status: "APROBADO",
          },
        },
        select: {
          id: true,
          fullName: true,
          teamId: true,
          team: {
            select: {
              animal: true,
            },
          },
        },
      });

      if (!member) throw new Error("Integrante no encontrado.");

      if (event.memberCapacity) {
        const currentMembers = await tx.eventRegistration.count({
          where: {
            eventId: event.id,
            memberId: {
              not: null,
            },
          },
        });

        if (currentMembers >= event.memberCapacity) {
          throw new Error("La actividad ya alcanzó su cupo máximo de integrantes.");
        }
      }

      const memberRegistrationKey = `${event.id}:${member.id}`;
      const registration = await tx.eventRegistration.create({
        data: {
          eventId: event.id,
          teamId: member.teamId,
          memberId: member.id,
          notes: notes || null,
          status: RegistrationStatus.APROBADA,
          memberRegistrationKey,
          teamRegistrationKey: null,
        },
      });

      return {
        registrationId: registration.id,
        eventName: event.name,
        memberName: member.fullName,
        teamName: member.team.animal,
        teamId: member.teamId,
      };
    });

    await createAuditLog({
      action: "REGISTER_MEMBER_TO_EVENT",
      entityType: "EventRegistration",
      entityId: result.registrationId,
      detail: `Se registró a ${result.memberName} (${result.teamName}) en ${result.eventName}`,
      createdById: actorId,
    });

    revalidateActivityPaths(result.teamId);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw normalizePrismaRegistrationError(error);
    }
    if (error instanceof Error) throw error;
    throw new Error("No se pudo registrar al integrante en la actividad.");
  }
}

export async function removeMemberFromEvent(registrationId: string) {
  const session = await requireStaff();
  const actorId = getActorIdFromSession(session);

  const edition = await getActiveEdition();
  if (!edition) throw new Error("No hay una edición activa.");

  const result = await db.$transaction(async (tx) => {
    const registration = await tx.eventRegistration.findFirst({
      where: {
        id: registrationId,
        memberId: {
          not: null,
        },
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
      throw new Error("Registro de integrante no encontrado.");
    }

    await tx.eventRegistration.delete({
      where: { id: registration.id },
    });

    return {
      registrationId: registration.id,
      eventName: registration.event.name,
      teamName: registration.team.animal,
      teamId: registration.team.id,
      memberName: registration.member?.fullName ?? "Integrante",
    };
  });

  await createAuditLog({
    action: "REMOVE_MEMBER_FROM_EVENT",
    entityType: "EventRegistration",
    entityId: result.registrationId,
    detail: `Se eliminó a ${result.memberName} (${result.teamName}) de ${result.eventName}`,
    createdById: actorId,
  });

  revalidateActivityPaths(result.teamId);
}
