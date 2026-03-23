"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";

export async function createStaffUser(formData: FormData) {
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
  });

  revalidatePath("/semana-cultural/admin/usuarios");
}

export async function updateUserRole(userId: string, role: UserRole) {
  await db.user.update({
    where: { id: userId },
    data: { role },
  });

  await createAuditLog({
    action: "UPDATE_USER_ROLE",
    entityType: "User",
    entityId: userId,
    detail: `Se cambió el rol del usuario a ${role}`,
  });

  revalidatePath("/semana-cultural/admin/usuarios");
}