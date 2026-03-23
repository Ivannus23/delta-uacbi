"use server";

import { db } from "@/lib/db";
import { getActiveEdition } from "@/lib/semana-cultural";
import { revalidatePath } from "next/cache";

export async function addMember(teamId: string, formData: FormData) {
  const edition = await getActiveEdition();
  if (!edition) {
    throw new Error("No hay una edición activa.");
  }

  const fullName = String(formData.get("fullName") || "").trim();
  const matricula = String(formData.get("matricula") || "").trim();
  const institutionalEmail = String(formData.get("institutionalEmail") || "").trim();
  const gradoGrupo = String(formData.get("gradoGrupo") || "").trim();

  if (!fullName || !matricula || !institutionalEmail || !gradoGrupo) {
    throw new Error("Faltan campos obligatorios del integrante.");
  }

  const team = await db.team.findFirst({
    where: {
      id: teamId,
      editionId: edition.id,
    },
    include: {
      members: true,
    },
  });

  if (!team) {
    throw new Error("Equipo no encontrado.");
  }

  if (team.members.length >= 50) {
    throw new Error("Este equipo ya alcanzó el límite de 50 integrantes.");
  }

  const existingMemberInEdition = await db.member.findFirst({
    where: {
      matricula,
      team: {
        editionId: edition.id,
      },
    },
  });

  if (existingMemberInEdition) {
    throw new Error("Ya existe un integrante con esa matrícula en esta edición.");
  }

  await db.member.create({
    data: {
      teamId,
      fullName,
      matricula,
      institutionalEmail,
      gradoGrupo,
    },
  });

  revalidatePath(`/semana-cultural/equipos/${teamId}`);
  revalidatePath("/semana-cultural/admin/equipos");
}

export async function removeMember(teamId: string, memberId: string) {
  await db.member.delete({
    where: { id: memberId },
  });

  revalidatePath(`/semana-cultural/equipos/${teamId}`);
  revalidatePath("/semana-cultural/admin/equipos");
}
