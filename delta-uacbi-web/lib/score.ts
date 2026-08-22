import { db } from "@/lib/db";
import {
  Prisma,
  ScoreMovementType,
  ScorePosition,
} from "@prisma/client";

export async function getPointsForRule(
  editionId: string,
  scoreCategoryId: string,
  position: ScorePosition
) {
  return db.scoreRule.findUnique({
    where: {
      editionId_scoreCategoryId_position: {
        editionId,
        scoreCategoryId,
        position,
      },
    },
  });
}

export async function recalculateTeamPoints(teamId: string) {
  return recalculateTeamPointsWithClient(db, teamId);
}

export async function recalculateTeamPointsWithClient(
  client: Prisma.TransactionClient | typeof db,
  teamId: string
) {
  // Bloquea la fila del equipo antes de leer/sumar para evitar "lost update"
  // cuando dos asignaciones de puntos concurrentes recalculan el mismo equipo.
  await client.$queryRaw`SELECT id FROM "Team" WHERE id = ${teamId} FOR UPDATE`;

  const logs = await client.scoreLog.findMany({
    where: { teamId },
    select: {
      movementType: true,
      points: true,
    },
  });

  const total = logs.reduce((acc, log) => {
    if (log.movementType === ScoreMovementType.RESTA) {
      return acc - Math.abs(log.points);
    }
    return acc + Math.abs(log.points);
  }, 0);

  await client.team.update({
    where: { id: teamId },
    data: { totalPoints: total },
  });

  return total;
}
