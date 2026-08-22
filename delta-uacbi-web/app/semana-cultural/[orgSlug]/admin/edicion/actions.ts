"use server";

import { createAuditLog } from "@/lib/audit";
import { requireOrgAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveEdition } from "@/lib/semana-cultural";
import { resolveAcademicUnitCodes } from "@/lib/academic-catalog";
import { revalidatePath } from "next/cache";

function getActorIdFromSession(session: Awaited<ReturnType<typeof requireOrgAdmin>>["session"]) {
  return session.user && typeof session.user === "object" && "id" in session.user && typeof session.user.id === "string"
    ? session.user.id
    : null;
}

function trimOrNull(value: FormDataEntryValue | null) {
  const str = String(value || "").trim();
  return str || null;
}

export async function updateEditionTheme(organizationId: string, orgSlug: string, formData: FormData) {
  const { session } = await requireOrgAdmin(organizationId);
  const actorId = getActorIdFromSession(session);

  const edition = await getActiveEdition(organizationId);
  if (!edition) {
    throw new Error("No hay una edición activa.");
  }

  const themeName = trimOrNull(formData.get("themeName"));
  const subtitle = trimOrNull(formData.get("subtitle"));
  const bannerImageUrl = trimOrNull(formData.get("bannerImageUrl"));
  const eventLogoUrl = trimOrNull(formData.get("eventLogoUrl"));
  const organizingUnitCodes = resolveAcademicUnitCodes(
    formData.getAll("organizingUnitCodes").map((value) => String(value))
  );

  const partnerLogos = [1, 2, 3, 4]
    .map((index) => ({
      url: trimOrNull(formData.get(`logo${index}Url`)),
      alt: trimOrNull(formData.get(`logo${index}Alt`)) || "",
    }))
    .filter((logo): logo is { url: string; alt: string } => Boolean(logo.url));

  await db.culturalEdition.update({
    where: { id: edition.id },
    data: {
      themeName,
      subtitle,
      bannerImageUrl,
      eventLogoUrl,
      partnerLogos,
      organizingUnitCodes,
    },
  });

  await createAuditLog({
    action: "UPDATE_EDITION_THEME",
    entityType: "CulturalEdition",
    entityId: edition.id,
    detail: "Se actualizó el tema visual de la edición",
    editionId: edition.id,
    createdById: actorId,
  });

  revalidatePath(`/semana-cultural/${orgSlug}`, "layout");
}

export async function updateEditionRegistrationFee(organizationId: string, orgSlug: string, formData: FormData) {
  const { session } = await requireOrgAdmin(organizationId);
  const actorId = getActorIdFromSession(session);

  const edition = await getActiveEdition(organizationId);
  if (!edition) {
    throw new Error("No hay una edición activa.");
  }

  const modeRaw = String(formData.get("registrationFeeMode") || "").trim();
  if (modeRaw !== "FREE" && modeRaw !== "FIXED") {
    throw new Error("Selecciona un modo de cuota válido.");
  }

  let registrationFeeAmount: number | null = null;

  if (modeRaw === "FIXED") {
    const hasAccount = await db.organizationMercadoPagoAccount.findUnique({ where: { organizationId } });
    if (!hasAccount && process.env.NODE_ENV === "production") {
      throw new Error(
        "Conecta la cuenta de Mercado Pago de esta organización en /admin/pagos antes de activar la cuota fija."
      );
    }

    const amountRaw = String(formData.get("registrationFeeAmount") || "").trim();
    const amount = Number(amountRaw);
    if (!amountRaw || !Number.isFinite(amount) || amount <= 0) {
      throw new Error("Ingresa un monto de cuota válido y mayor a cero.");
    }
    registrationFeeAmount = amount;
  }

  await db.culturalEdition.update({
    where: { id: edition.id },
    data: {
      registrationFeeMode: modeRaw,
      registrationFeeAmount,
    },
  });

  await createAuditLog({
    action: "UPDATE_EDITION_REGISTRATION_FEE",
    entityType: "CulturalEdition",
    entityId: edition.id,
    detail: `Se actualizó la cuota de inscripción a ${modeRaw}${registrationFeeAmount ? ` ($${registrationFeeAmount})` : ""}.`,
    editionId: edition.id,
    createdById: actorId,
  });

  revalidatePath(`/semana-cultural/${orgSlug}/admin/edicion`);
  revalidatePath(`/semana-cultural/${orgSlug}/registro`);
}
