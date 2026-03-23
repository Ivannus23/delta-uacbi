"use server";

import { db } from "@/lib/db";
import { getActiveEdition } from "@/lib/semana-cultural";
import { getPointsForRule, recalculateTeamPoints } from "@/lib/score";
import { ScoreMovementType, ScorePosition } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";

export async function assignScore(formData: FormData) {
  const edition = await getActiveEdition();
  if (!edition) throw new Error("No hay una edición activa.");

  const eventId = String(formData.get("eventId") || "").trim();
  const teamId = String(formData.get("teamId") || "").trim();
  const position = String(formData.get("position") || "").trim() as ScorePosition;
  const reason = String(formData.get("reason") || "").trim();

  if (!eventId || !teamId || !position || !reason) {
    throw new Error("Faltan campos obligatorios.");
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

  if (!["CERRADA", "FINALIZADA"].includes(event.status)) {
    throw new Error("Solo puedes asignar puntos cuando la actividad esté cerrada o finalizada.");
  }

  const team = await db.team.findFirst({
    where: {
      id: teamId,
      editionId: edition.id,
    },
  });

  if (!team) throw new Error("Equipo no encontrado.");

  const isRegistered = event.registrations.some(
    (registration) => registration.teamId === team.id && registration.memberId === null
  );

  if (!isRegistered) {
    throw new Error("Este equipo no está inscrito en la actividad seleccionada.");
  }

  const rule = await getPointsForRule(edition.id, event.scoreCategory, position);
  if (!rule) throw new Error("No existe regla de puntuación para esa combinación.");

  const movementType =
    position === ScorePosition.PENALIZACION
      ? ScoreMovementType.RESTA
      : ScoreMovementType.SUMA;

  await db.scoreLog.create({
    data: {
      editionId: edition.id,
      eventId: event.id,
      teamId: team.id,
      movementType,
      points: Math.abs(rule.points),
      reason,
    },
  });

  await createAuditLog({
    action: "ASSIGN_SCORE",
    entityType: "ScoreLog",
    entityId: team.id,
    detail: `Se asignaron ${rule.points} puntos a ${team.name} en ${event.name}`,
  });

  await recalculateTeamPoints(team.id);

  revalidatePath("/semana-cultural/ranking");
  revalidatePath("/semana-cultural/admin/equipos");
  revalidatePath("/semana-cultural/admin/puntos");
  revalidatePath("/semana-cultural/admin/dashboard");
}

export async function deleteScoreLog(scoreLogId: string, teamId: string) {
  await db.scoreLog.delete({
    where: { id: scoreLogId },
  });

  await createAuditLog({
    action: "DELETE_SCORE_LOG",
    entityType: "ScoreLog",
    entityId: scoreLogId,
    detail: `Se eliminó un movimiento de puntos del equipo ${teamId}`,
  });

  await recalculateTeamPoints(teamId);

  revalidatePath("/semana-cultural/ranking");
  revalidatePath("/semana-cultural/admin/equipos");
  revalidatePath("/semana-cultural/admin/puntos");
  revalidatePath("/semana-cultural/admin/dashboard");
}
