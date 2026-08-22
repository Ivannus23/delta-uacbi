"use server";

import { createAuditLog } from "@/lib/audit";
import { requireOrgStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveEdition } from "@/lib/semana-cultural";
import { revalidatePath } from "next/cache";
import { TeamStatus } from "@prisma/client";

export async function updateTeamStatus(
  organizationId: string,
  orgSlug: string,
  teamId: string,
  status: TeamStatus
) {
  const { session } = await requireOrgStaff(organizationId);
  const actorId =
    session.user && typeof session.user === "object" && "id" in session.user && typeof session.user.id === "string"
      ? session.user.id
      : null;

  const edition = await getActiveEdition(organizationId);
  if (!edition) {
    throw new Error("No hay una edición activa.");
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

  if (status === TeamStatus.APROBADO && edition.registrationFeeMode === "FIXED") {
    const paidPayment = await db.teamPayment.findFirst({
      where: { teamId: team.id, status: "PAID" },
    });
    if (!paidPayment) {
      throw new Error("Este equipo no ha pagado su cuota de inscripción.");
    }
  }

  await db.team.update({
    where: { id: team.id },
    data: { status },
  });

  await createAuditLog({
    action: status === TeamStatus.APROBADO ? "APPROVE_TEAM" : "REJECT_TEAM",
    entityType: "Team",
    entityId: team.id,
    detail: `El equipo ${team.animal} cambió de ${team.status} a ${status}`,
    editionId: edition.id,
    createdById: actorId,
  });

  const base = `/semana-cultural/${orgSlug}`;
  revalidatePath(`${base}/equipos/${team.id}`);
  revalidatePath(`${base}/mi-equipo`);
  revalidatePath(`${base}/admin/equipos`);
  revalidatePath(`${base}/admin/actividades`);
  revalidatePath(`${base}/admin/dashboard`);
  revalidatePath(`${base}/ranking`);
  revalidatePath(`${base}/resultados`);
}
