import { db } from "@/lib/db";
import {
  ScoreCategory,
  ScoreMovementType,
  ScorePosition,
} from "@prisma/client";

export async function getPointsForRule(
  editionId: string,
  category: ScoreCategory,
  position: ScorePosition
) {
  return db.scoreRule.findUnique({
    where: {
      editionId_category_position: {
        editionId,
        category,
        position,
      },
    },
  });
}

export async function recalculateTeamPoints(teamId: string) {
  const logs = await db.scoreLog.findMany({
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

  await db.team.update({
    where: { id: teamId },
    data: { totalPoints: total },
  });

  return total;
}
