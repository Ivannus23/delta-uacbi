import { db } from "@/lib/db";

export async function getTeamNameOptions(editionId: string) {
  return db.teamNameOption.findMany({
    where: { editionId },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
}

export async function getScoreCategories(editionId: string) {
  return db.scoreCategoryDef.findMany({
    where: { editionId },
    orderBy: [{ order: "asc" }, { label: "asc" }],
  });
}

export async function resolveTeamNameOptionId(editionId: string, name: string) {
  const option = await db.teamNameOption.findFirst({
    where: { editionId, name },
    select: { id: true },
  });
  if (!option) {
    throw new Error("El nombre de equipo seleccionado no es valido.");
  }
  return option.id;
}
