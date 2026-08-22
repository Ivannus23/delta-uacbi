"use server";

import { createAuditLog } from "@/lib/audit";
import { requireOrgAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { OrgRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

function getActorIdFromSession(session: Awaited<ReturnType<typeof requireOrgAdmin>>["session"]) {
  return session.user && typeof session.user === "object" && "id" in session.user && typeof session.user.id === "string"
    ? session.user.id
    : null;
}

export async function addOrgMember(organizationId: string, orgSlug: string, formData: FormData) {
  const { session } = await requireOrgAdmin(organizationId);
  const actorId = getActorIdFromSession(session);

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const roleRaw = String(formData.get("role") || "").trim();

  if (!name || !email || !roleRaw) {
    throw new Error("Faltan campos obligatorios.");
  }

  if (!Object.values(OrgRole).includes(roleRaw as OrgRole)) {
    throw new Error("Rol invalido.");
  }
  const role = roleRaw as OrgRole;

  const user = await db.user.upsert({
    where: { email },
    update: { name },
    create: { name, email },
  });

  await db.organizationMembership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId } },
    update: { role },
    create: { userId: user.id, organizationId, role },
  });

  await createAuditLog({
    action: "UPSERT_ORG_MEMBERSHIP",
    entityType: "OrganizationMembership",
    detail: `Se agrego o actualizo a ${email} con rol ${role} en la organizacion`,
    createdById: actorId,
  });

  revalidatePath(`/semana-cultural/${orgSlug}/admin/miembros`);
}

export async function updateOrgMemberRole(
  organizationId: string,
  orgSlug: string,
  userId: string,
  role: OrgRole
) {
  const { session } = await requireOrgAdmin(organizationId);
  const actorId = getActorIdFromSession(session);

  await db.organizationMembership.update({
    where: { userId_organizationId: { userId, organizationId } },
    data: { role },
  });

  await createAuditLog({
    action: "UPDATE_ORG_MEMBERSHIP_ROLE",
    entityType: "OrganizationMembership",
    entityId: userId,
    detail: `Se cambio el rol del miembro a ${role}`,
    createdById: actorId,
  });

  revalidatePath(`/semana-cultural/${orgSlug}/admin/miembros`);
}

export async function removeOrgMember(organizationId: string, orgSlug: string, userId: string) {
  const { session } = await requireOrgAdmin(organizationId);
  const actorId = getActorIdFromSession(session);

  await db.organizationMembership.delete({
    where: { userId_organizationId: { userId, organizationId } },
  });

  await createAuditLog({
    action: "REMOVE_ORG_MEMBERSHIP",
    entityType: "OrganizationMembership",
    entityId: userId,
    detail: "Se elimino la membresia de la organizacion",
    createdById: actorId,
  });

  revalidatePath(`/semana-cultural/${orgSlug}/admin/miembros`);
}
