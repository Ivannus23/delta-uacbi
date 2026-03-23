"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { TeamStatus } from "@prisma/client";

export async function updateTeamStatus(teamId: string, status: TeamStatus) {
  await db.team.update({
    where: { id: teamId },
    data: { status },
  });

  revalidatePath("/semana-cultural/admin/equipos");
  revalidatePath("/semana-cultural/admin/actividades");
}
