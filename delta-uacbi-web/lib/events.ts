import { db } from "@/lib/db";
import { getActiveEdition } from "@/lib/semana-cultural";

export async function getActiveEditionWithEvents() {
  const edition = await getActiveEdition();
  if (!edition) return null;

  const events = await db.event.findMany({
    where: { editionId: edition.id },
    include: {
      registrations: {
        include: {
          team: {
            include: {
              members: {
                select: {
                  academicUnit: true,
                },
              },
            },
          },
          member: true,
        },
      },
    },
    orderBy: { eventDate: "asc" },
  });

  return {
    edition,
    events,
  };
}

export async function getAvailableTeams() {
  const edition = await getActiveEdition();
  if (!edition) return [];

  return db.team.findMany({
    where: {
      editionId: edition.id,
      status: "APROBADO",
    },
    include: {
      members: {
        select: {
          academicUnit: true,
        },
      },
    },
    orderBy: { animal: "asc" },
  });
}
