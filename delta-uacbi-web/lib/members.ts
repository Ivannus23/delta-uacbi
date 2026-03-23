import { db } from "@/lib/db";
import { getActiveEdition } from "@/lib/semana-cultural";

export async function getAvailableMembers() {
  const edition = await getActiveEdition();
  if (!edition) return [];

  return db.member.findMany({
    where: {
      team: {
        editionId: edition.id,
        status: "APROBADO",
      },
    },
    include: {
      team: true,
    },
    orderBy: { fullName: "asc" },
  });
}
