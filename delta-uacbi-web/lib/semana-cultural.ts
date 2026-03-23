import { db } from "@/lib/db";

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

  return db.team.findMany({
    where: { editionId: edition.id },
    orderBy: [{ totalPoints: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      unidadAcademica: true,
      color: true,
      animal: true,
      totalPoints: true,
      status: true,
    },
  });
}
