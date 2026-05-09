"use server";

import { createAuditLog } from "@/lib/audit";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveEdition } from "@/lib/semana-cultural";
import { revalidatePath } from "next/cache";
import { TeamStatus } from "@prisma/client";

export async function updateTeamStatus(teamId: string, status: TeamStatus) {
  const session = await requireStaff();
  const actorId =
    session.user && typeof session.user === "object" && "id" in session.user && typeof session.user.id === "string"
      ? session.user.id
      : null;

  const edition = await getActiveEdition();
  if (!edition) {
    throw new Error("No hay una ediciÃ³n activa.");
  }

  const team = await db.team.findFirst({
    where: {
      id: teamId,
      editionId: edition.id,
    },
    select: {
      id: true,
      animal: true,
      status: true,
    },
  });

  if (!team) {
    throw new Error("Equipo no encontrado.");
  }

  await db.team.update({
    where: { id: team.id },
    data: { status },
  });

  await createAuditLog({
    action: status === TeamStatus.APROBADO ? "APPROVE_TEAM" : "REJECT_TEAM",
    entityType: "Team",
    entityId: team.id,
    detail: `El equipo ${team.animal} cambiÃ³ de ${team.status} a ${status}`,
    createdById: actorId,
  });

  revalidatePath(`/semana-cultural/equipos/${team.id}`);
  revalidatePath("/semana-cultural/mi-equipo");
  revalidatePath("/semana-cultural/admin/equipos");
  revalidatePath("/semana-cultural/admin/actividades");
  revalidatePath("/semana-cultural/admin/dashboard");
  revalidatePath("/semana-cultural/ranking");
  revalidatePath("/semana-cultural/resultados");
}


