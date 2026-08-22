import { db } from "@/lib/db";
import { getActiveEdition } from "@/lib/semana-cultural";

export async function getAvailableMembers(organizationId: string) {
  const edition = await getActiveEdition(organizationId);
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
