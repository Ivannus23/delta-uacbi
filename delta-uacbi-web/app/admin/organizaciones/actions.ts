"use server";

import { createAuditLog } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveAcademicUnitCodes } from "@/lib/academic-catalog";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

function getActorIdFromSession(session: Awaited<ReturnType<typeof requireAdmin>>) {
  return session.user && typeof session.user === "object" && "id" in session.user && typeof session.user.id === "string"
    ? session.user.id
    : null;
}

const SLUG_REGEX = /^[a-z0-9-]{2,40}$/;
const COMBINING_DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS_REGEX, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createOrganizationWithEdition(formData: FormData) {
  const session = await requireAdmin();
  const actorId = getActorIdFromSession(session);

  const orgName = String(formData.get("orgName") || "").trim();
  const orgSlugRaw = String(formData.get("orgSlug") || "").trim();
  const editionName = String(formData.get("editionName") || "").trim();
  const yearRaw = String(formData.get("year") || "").trim();
  const startDateRaw = String(formData.get("startDate") || "").trim();
  const endDateRaw = String(formData.get("endDate") || "").trim();
  const organizingUnitCodesRaw = formData.getAll("organizingUnitCodes").map((value) => String(value));

  if (!orgName || !editionName || !yearRaw || !startDateRaw || !endDateRaw) {
    throw new Error("Faltan campos obligatorios.");
  }

  const organizingUnitCodes = resolveAcademicUnitCodes(organizingUnitCodesRaw);

  const orgSlug = slugify(orgSlugRaw || orgName);
  if (!SLUG_REGEX.test(orgSlug)) {
    throw new Error("El slug de la organizacion no es valido (usa minusculas, numeros y guiones).");
  }

  const year = Number(yearRaw);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("El anio no es valido.");
  }

  const startDate = new Date(startDateRaw);
  const endDate = new Date(endDateRaw);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error("Las fechas no son validas.");
  }
  if (endDate.getTime() <= startDate.getTime()) {
    throw new Error("La fecha de fin debe ser mayor a la fecha de inicio.");
  }

  try {
    const organization = await db.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { slug: orgSlug, name: orgName },
      });

      await tx.culturalEdition.create({
        data: {
          organizationId: org.id,
          slug: String(year),
          name: editionName,
          year,
          startDate,
          endDate,
          isActive: true,
          organizingUnitCodes,
        },
      });

      if (actorId) {
        await tx.organizationMembership.create({
          data: { organizationId: org.id, userId: actorId, role: "ADMIN" },
        });
      }

      return org;
    });

    await createAuditLog({
      action: "CREATE_ORGANIZATION",
      entityType: "Organization",
      entityId: organization.id,
      detail: `Se creo la organizacion ${organization.name} (${organization.slug})`,
      createdById: actorId,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Ya existe una organizacion con ese slug.");
    }
    if (error instanceof Error) throw error;
    throw new Error("No se pudo crear la organizacion.");
  }

  revalidatePath("/admin/organizaciones");
}

export async function updateOrganizationSubscription(organizationId: string, formData: FormData) {
  const session = await requireAdmin();
  const actorId = getActorIdFromSession(session);

  const statusRaw = String(formData.get("subscriptionStatus") || "").trim();
  if (statusRaw !== "ACTIVE" && statusRaw !== "SUSPENDED") {
    throw new Error("Estado de suscripción inválido.");
  }

  const priceRaw = String(formData.get("subscriptionPriceAmount") || "").trim();
  let subscriptionPriceAmount: number | null = null;
  if (priceRaw) {
    const price = Number(priceRaw);
    if (!Number.isFinite(price) || price < 0) {
      throw new Error("El precio no es válido.");
    }
    subscriptionPriceAmount = price;
  }

  const subscriptionNotes = String(formData.get("subscriptionNotes") || "").trim() || null;

  const organization = await db.organization.update({
    where: { id: organizationId },
    data: {
      subscriptionStatus: statusRaw,
      subscriptionPriceAmount,
      subscriptionNotes,
    },
  });

  await createAuditLog({
    action: statusRaw === "SUSPENDED" ? "SUSPEND_ORGANIZATION" : "ACTIVATE_ORGANIZATION",
    entityType: "Organization",
    entityId: organization.id,
    detail: `Se actualizó la suscripción de ${organization.name} a ${statusRaw}${
      subscriptionPriceAmount ? ` ($${subscriptionPriceAmount})` : ""
    }`,
    createdById: actorId,
  });

  revalidatePath("/admin/organizaciones");
  revalidatePath(`/semana-cultural/${organization.slug}`, "layout");
}
