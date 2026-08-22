"use server";

import { createAuditLog } from "@/lib/audit";
import { requireOrgAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveAcademicUnitCodes } from "@/lib/academic-catalog";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

function getActorIdFromSession(session: Awaited<ReturnType<typeof requireOrgAdmin>>["session"]) {
  return session.user && typeof session.user === "object" && "id" in session.user && typeof session.user.id === "string"
    ? session.user.id
    : null;
}

export async function createEdition(organizationId: string, orgSlug: string, formData: FormData) {
  const { session } = await requireOrgAdmin(organizationId);
  const actorId = getActorIdFromSession(session);

  const editionName = String(formData.get("editionName") || "").trim();
  const yearRaw = String(formData.get("year") || "").trim();
  const startDateRaw = String(formData.get("startDate") || "").trim();
  const endDateRaw = String(formData.get("endDate") || "").trim();
  const organizingUnitCodesRaw = formData.getAll("organizingUnitCodes").map((value) => String(value));

  if (!editionName || !yearRaw || !startDateRaw || !endDateRaw) {
    throw new Error("Faltan campos obligatorios.");
  }

  const organizingUnitCodes = resolveAcademicUnitCodes(organizingUnitCodesRaw);

  const year = Number(yearRaw);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("El año no es válido.");
  }

  const startDate = new Date(startDateRaw);
  const endDate = new Date(endDateRaw);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error("Las fechas no son válidas.");
  }
  if (endDate.getTime() <= startDate.getTime()) {
    throw new Error("La fecha de fin debe ser mayor a la fecha de inicio.");
  }

  const makeActive = formData.get("makeActive") === "on";

  try {
    const edition = await db.$transaction(async (tx) => {
      if (makeActive) {
        await tx.culturalEdition.updateMany({
          where: { organizationId, isActive: true },
          data: { isActive: false },
        });
      }

      return tx.culturalEdition.create({
        data: {
          organizationId,
          slug: String(year),
          name: editionName,
          year,
          startDate,
          endDate,
          isActive: makeActive,
          organizingUnitCodes,
        },
      });
    });

    await createAuditLog({
      action: "CREATE_EDITION",
      entityType: "CulturalEdition",
      entityId: edition.id,
      detail: `Se creó la edición ${edition.name} (${edition.year})`,
      editionId: edition.id,
      createdById: actorId,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Ya existe una edición con ese año en esta organización.");
    }
    if (error instanceof Error) throw error;
    throw new Error("No se pudo crear la edición.");
  }

  revalidatePath(`/semana-cultural/${orgSlug}`, "layout");
  revalidatePath(`/semana-cultural/${orgSlug}/admin/ediciones`);
}

export async function activateEdition(organizationId: string, orgSlug: string, editionId: string) {
  const { session } = await requireOrgAdmin(organizationId);
  const actorId = getActorIdFromSession(session);

  const edition = await db.culturalEdition.findFirst({
    where: { id: editionId, organizationId },
  });
  if (!edition) {
    throw new Error("Edición no encontrada.");
  }

  await db.$transaction([
    db.culturalEdition.updateMany({
      where: { organizationId, isActive: true },
      data: { isActive: false },
    }),
    db.culturalEdition.update({
      where: { id: edition.id },
      data: { isActive: true },
    }),
  ]);

  await createAuditLog({
    action: "ACTIVATE_EDITION",
    entityType: "CulturalEdition",
    entityId: edition.id,
    detail: `Se activó la edición ${edition.name} (${edition.year})`,
    editionId: edition.id,
    createdById: actorId,
  });

  revalidatePath(`/semana-cultural/${orgSlug}`, "layout");
  revalidatePath(`/semana-cultural/${orgSlug}/admin/ediciones`);
}
