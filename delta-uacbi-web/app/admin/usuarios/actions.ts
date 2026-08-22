"use server";

import { createAuditLog } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

function getActorIdFromSession(session: Awaited<ReturnType<typeof requireAdmin>>) {
  return session.user && typeof session.user === "object" && "id" in session.user && typeof session.user.id === "string"
    ? session.user.id
    : null;
}

export async function createStaffUser(formData: FormData) {
  const session = await requireAdmin();
  const actorId = getActorIdFromSession(session);

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "").trim() as UserRole;

  if (!name || !email || !role) {
    throw new Error("Faltan campos obligatorios.");
  }

  await db.user.upsert({
    where: { email },
    update: {
      name,
      role,
    },
    create: {
      name,
      email,
      role,
    },
  });

  await createAuditLog({
    action: "UPSERT_USER",
    entityType: "User",
    detail: `Se creó o actualizó el usuario ${email} con rol ${role}`,
    createdById: actorId,
  });

  revalidatePath("/admin/usuarios");
}

export async function updateUserRole(userId: string, role: UserRole) {
  const session = await requireAdmin();
  const actorId = getActorIdFromSession(session);

  await db.user.update({
    where: { id: userId },
    data: { role },
  });

  await createAuditLog({
    action: "UPDATE_USER_ROLE",
    entityType: "User",
    entityId: userId,
    detail: `Se cambió el rol del usuario a ${role}`,
    createdById: actorId,
  });

  revalidatePath("/admin/usuarios");
}
