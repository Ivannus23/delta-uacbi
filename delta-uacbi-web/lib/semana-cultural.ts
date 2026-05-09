import { db } from "@/lib/db";
import {
  getTeamCompositionFromMembers,
  getTeamCompositionLabel,
} from "@/lib/semana-cultural-config";

export async function getActiveEdition() {
  return db.culturalEdition.findFirst({
    where: { isActive: true },
    orderBy: { year: "desc" },
  });
}

export async function getActiveEvents() {
  const edition = await getActiveEdition();
  if (!edition) return [];

  return db.event.findMany({
    where: {
      editionId: edition.id,
      isVisible: true,
      status: {
        in: ["ABIERTA", "CERRADA", "FINALIZADA"],
      },
    },
    orderBy: { eventDate: "asc" },
  });
}

export async function getRanking() {
  const edition = await getActiveEdition();
  if (!edition) return [];

  const teams = await db.team.findMany({
    where: { editionId: edition.id },
    orderBy: [{ totalPoints: "desc" }, { animal: "asc" }],
    select: {
      id: true,
      animal: true,
      members: {
        select: {
          academicUnit: true,
        },
      },
      totalPoints: true,
      status: true,
    },
  });

  return teams.map((team) => ({
    id: team.id,
    animal: team.animal,
    compositionLabel: getTeamCompositionLabel(getTeamCompositionFromMembers(team.members)),
    totalPoints: team.totalPoints,
    status: team.status,
  }));
}
