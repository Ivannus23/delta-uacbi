"use server";

import { createAuditLog } from "@/lib/audit";
import { requireOrgAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveEdition } from "@/lib/semana-cultural";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

function getActorIdFromSession(session: Awaited<ReturnType<typeof requireOrgAdmin>>["session"]) {
  return session.user && typeof session.user === "object" && "id" in session.user && typeof session.user.id === "string"
    ? session.user.id
    : null;
}

const COMBINING_DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

function slugifyCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS_REGEX, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function resolveActiveEdition(organizationId: string) {
  const edition = await getActiveEdition(organizationId);
  if (!edition) {
    throw new Error("No hay una edición activa.");
  }
  return edition;
}

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

// --- Nombres de equipo -------------------------------------------------

export async function addTeamNameOption(organizationId: string, orgSlug: string, formData: FormData) {
  const { session } = await requireOrgAdmin(organizationId);
  const actorId = getActorIdFromSession(session);
  const edition = await resolveActiveEdition(organizationId);

  const name = String(formData.get("name") || "").trim();
  if (!name) {
    throw new Error("El nombre del equipo es obligatorio.");
  }

  try {
    await db.teamNameOption.create({
      data: { editionId: edition.id, name },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("Ese nombre de equipo ya existe en esta edición.");
    }
    throw error;
  }

  await createAuditLog({
    action: "CREATE_TEAM_NAME_OPTION",
    entityType: "TeamNameOption",
    detail: `Se agregó el nombre de equipo "${name}"`,
    editionId: edition.id,
    createdById: actorId,
  });

  revalidatePath(`/semana-cultural/${orgSlug}/admin/catalogos`);
}

export async function deleteTeamNameOption(organizationId: string, orgSlug: string, id: string) {
  const { session } = await requireOrgAdmin(organizationId);
  const actorId = getActorIdFromSession(session);
  const edition = await resolveActiveEdition(organizationId);

  await db.teamNameOption.delete({
    where: { id, editionId: edition.id },
  });

  await createAuditLog({
    action: "DELETE_TEAM_NAME_OPTION",
    entityType: "TeamNameOption",
    entityId: id,
    detail: "Se eliminó un nombre de equipo",
    editionId: edition.id,
    createdById: actorId,
  });

  revalidatePath(`/semana-cultural/${orgSlug}/admin/catalogos`);
}

// --- Categorías de puntaje ----------------------------------------------

export async function addScoreCategory(organizationId: string, orgSlug: string, formData: FormData) {
  const { session } = await requireOrgAdmin(organizationId);
  const actorId = getActorIdFromSession(session);
  const edition = await resolveActiveEdition(organizationId);

  const label = String(formData.get("label") || "").trim();
  const colorHex = String(formData.get("colorHex") || "").trim() || null;
  if (!label) {
    throw new Error("El nombre de la categoría es obligatorio.");
  }

  const code = slugifyCode(label);
  if (!code) {
    throw new Error("El nombre de la categoría no es válido.");
  }

  try {
    await db.scoreCategoryDef.create({
      data: { editionId: edition.id, code, label, colorHex },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("Ya existe una categoría equivalente en esta edición.");
    }
    throw error;
  }

  await createAuditLog({
    action: "CREATE_SCORE_CATEGORY",
    entityType: "ScoreCategoryDef",
    detail: `Se agregó la categoría de puntaje "${label}"`,
    editionId: edition.id,
    createdById: actorId,
  });

  revalidatePath(`/semana-cultural/${orgSlug}/admin/catalogos`);
}

export async function deleteScoreCategory(organizationId: string, orgSlug: string, id: string) {
  const { session } = await requireOrgAdmin(organizationId);
  const actorId = getActorIdFromSession(session);
  const edition = await resolveActiveEdition(organizationId);

  await db.scoreCategoryDef.delete({
    where: { id, editionId: edition.id },
  });

  await createAuditLog({
    action: "DELETE_SCORE_CATEGORY",
    entityType: "ScoreCategoryDef",
    entityId: id,
    detail: "Se eliminó una categoría de puntaje (y sus reglas de puntuación asociadas)",
    editionId: edition.id,
    createdById: actorId,
  });

  revalidatePath(`/semana-cultural/${orgSlug}/admin/catalogos`);
}
