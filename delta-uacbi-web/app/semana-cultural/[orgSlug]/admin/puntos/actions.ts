"use server";

import { createAuditLog } from "@/lib/audit";
import { requireOrgStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { recalculateTeamPointsWithClient } from "@/lib/score";
import { getActiveEdition } from "@/lib/semana-cultural";
import { Prisma, ScoreMovementType, ScorePosition } from "@prisma/client";
import { revalidatePath } from "next/cache";

function getActorIdFromSession(session: Awaited<ReturnType<typeof requireOrgStaff>>["session"]) {
  return session.user &&
    typeof session.user === "object" &&
    "id" in session.user &&
    typeof session.user.id === "string"
    ? session.user.id
    : null;
}

function ensureValidScorePosition(rawValue: string) {
  if (!Object.values(ScorePosition).includes(rawValue as ScorePosition)) {
    throw new Error("La posición seleccionada no es válida.");
  }
  return rawValue as ScorePosition;
}

function revalidateScorePaths(orgSlug: string, teamId: string) {
  const base = `/semana-cultural/${orgSlug}`;
  revalidatePath(`${base}/ranking`);
  revalidatePath(`${base}/resultados`);
  revalidatePath(`${base}/admin/equipos`);
  revalidatePath(`${base}/admin/puntos`);
  revalidatePath(`${base}/admin/dashboard`);
  revalidatePath(`${base}/equipos/${teamId}`);
}

export async function assignScore(organizationId: string, orgSlug: string, formData: FormData) {
  const { session } = await requireOrgStaff(organizationId);
  const actorId = getActorIdFromSession(session);

  const edition = await getActiveEdition(organizationId);
  if (!edition) throw new Error("No hay una edición activa.");

  const eventId = String(formData.get("eventId") || "").trim();
  const teamId = String(formData.get("teamId") || "").trim();
  const position = ensureValidScorePosition(String(formData.get("position") || "").trim());
  const reason = String(formData.get("reason") || "").trim();

  if (!eventId || !teamId || !reason) {
    throw new Error("Faltan campos obligatorios.");
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const event = await tx.event.findFirst({
        where: {
          id: eventId,
          editionId: edition.id,
        },
        select: {
          id: true,
          name: true,
          isScored: true,
          scoreCategoryId: true,
          status: true,
        },
      });

      if (!event) throw new Error("Actividad no encontrada.");
      if (!event.isScored || !event.scoreCategoryId) {
        throw new Error("Esta actividad no suma puntos.");
      }
      if (!["CERRADA", "FINALIZADA"].includes(event.status)) {
        throw new Error("Solo puedes asignar puntos cuando la actividad esté cerrada o finalizada.");
      }

      const team = await tx.team.findFirst({
        where: {
          id: teamId,
          editionId: edition.id,
        },
        select: {
          id: true,
          animal: true,
        },
      });

      if (!team) throw new Error("Equipo no encontrado.");

      // También permite puntuar equipo por participación individual:
      // basta que exista cualquier inscripción del equipo en la actividad.
      const isRegistered = await tx.eventRegistration.findFirst({
        where: {
          eventId: event.id,
          teamId: team.id,
        },
        select: {
          id: true,
        },
      });

      if (!isRegistered) {
        throw new Error("Este equipo no está inscrito en la actividad seleccionada.");
      }

      const rule = await tx.scoreRule.findUnique({
        where: {
          editionId_scoreCategoryId_position: {
            editionId: edition.id,
            scoreCategoryId: event.scoreCategoryId,
            position,
          },
        },
      });
      if (!rule) throw new Error("No existe regla de puntuación para esa combinación.");

      const movementType =
        position === ScorePosition.PENALIZACION
          ? ScoreMovementType.RESTA
          : ScoreMovementType.SUMA;

      const scoreLog = await tx.scoreLog.create({
        data: {
          editionId: edition.id,
          eventId: event.id,
          teamId: team.id,
          position,
          movementType,
          points: Math.abs(rule.points),
          reason,
          createdById: actorId,
          eventPositionKey: `${event.id}:${team.id}:${position}`,
        },
      });

      await recalculateTeamPointsWithClient(tx, team.id);

      return {
        teamId: team.id,
        teamName: team.animal,
        eventName: event.name,
        points: rule.points,
        scoreLogId: scoreLog.id,
      };
    });

    await createAuditLog({
      action: "ASSIGN_SCORE",
      entityType: "ScoreLog",
      entityId: result.scoreLogId,
      detail: `Se asignaron ${result.points} puntos a ${result.teamName} en ${result.eventName}`,
      editionId: edition.id,
      createdById: actorId,
    });

    revalidateScorePaths(orgSlug, result.teamId);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = Array.isArray(error.meta?.target)
          ? error.meta.target.map((value) => String(value))
          : [];

        if (
          target.some((value) => value.includes("eventPositionKey")) ||
          target.some((value) => value.includes("ScoreLog_event_team_position_unique_idx"))
        ) {
          throw new Error(
            "Ya existe una puntuación para ese equipo, actividad y posición. Elimina el registro anterior para cambiarla."
          );
        }

        throw new Error("No se pudo asignar la puntuación por un conflicto de datos.");
      }

      throw new Error("No se pudo asignar la puntuación. Inténtalo nuevamente.");
    }

    if (error instanceof Error) throw error;
    throw new Error("No se pudo asignar la puntuación. Inténtalo nuevamente.");
  }
}

export async function deleteScoreLog(
  organizationId: string,
  orgSlug: string,
  scoreLogId: string,
  _teamIdFromClient?: string
) {
  void _teamIdFromClient;

  const { session } = await requireOrgStaff(organizationId);
  const actorId = getActorIdFromSession(session);

  const edition = await getActiveEdition(organizationId);
  if (!edition) throw new Error("No hay una edición activa.");

  try {
    const result = await db.$transaction(async (tx) => {
      const scoreLog = await tx.scoreLog.findFirst({
        where: {
          id: scoreLogId,
          editionId: edition.id,
        },
        include: {
          team: {
            select: {
              id: true,
              animal: true,
            },
          },
          event: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!scoreLog) {
        throw new Error("Movimiento de puntos no encontrado.");
      }

      await tx.scoreLog.delete({
        where: { id: scoreLog.id },
      });

      await recalculateTeamPointsWithClient(tx, scoreLog.teamId);

      return {
        teamId: scoreLog.team.id,
        teamName: scoreLog.team.animal,
        eventName: scoreLog.event?.name ?? "Sin actividad",
        scoreLogId: scoreLog.id,
      };
    });

    await createAuditLog({
      action: "DELETE_SCORE_LOG",
      entityType: "ScoreLog",
      entityId: result.scoreLogId,
      detail: `Se eliminó un movimiento de puntos de ${result.teamName} (${result.eventName})`,
      editionId: edition.id,
      createdById: actorId,
    });

    revalidateScorePaths(orgSlug, result.teamId);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Error("No se pudo eliminar el movimiento de puntos. Inténtalo nuevamente.");
    }
    if (error instanceof Error) throw error;
    throw new Error("No se pudo eliminar el movimiento de puntos. Inténtalo nuevamente.");
  }
}
