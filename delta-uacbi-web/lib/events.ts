import { db } from "@/lib/db";
import { getActiveEdition } from "@/lib/semana-cultural";

export async function getActiveEditionWithEvents(organizationId: string) {
  const edition = await getActiveEdition(organizationId);
  if (!edition) return null;

  const events = await db.event.findMany({
    where: { editionId: edition.id },
    include: {
      scoreCategory: true,
      registrations: {
        include: {
          team: {
            include: {
              members: {
                select: {
                  academicUnitCode: true,
                },
              },
            },
          },
          member: true,
        },
      },
    },
    orderBy: [{ eventDate: "asc" }, { startTime: "asc" }],
  });

  return {
    edition,
    events,
  };
}

export async function getAvailableTeams(organizationId: string) {
  const edition = await getActiveEdition(organizationId);
  if (!edition) return [];

  return db.team.findMany({
    where: {
      editionId: edition.id,
      status: "APROBADO",
    },
    include: {
      members: {
        select: {
          academicUnitCode: true,
        },
      },
    },
    orderBy: { animal: "asc" },
  });
}
