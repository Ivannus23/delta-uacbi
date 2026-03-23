"use server";

import { db } from "@/lib/db";
import { getActiveEdition } from "@/lib/semana-cultural";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

export async function createTeam(formData: FormData) {
  const edition = await getActiveEdition();
  if (!edition) {
    throw new Error("No hay una edición activa.");
  }

  const unidadAcademica = String(formData.get("unidadAcademica") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const animal = String(formData.get("animal") || "").trim();
  const color = String(formData.get("color") || "").trim();
  const responsableNombre = String(formData.get("responsableNombre") || "").trim();
  const responsableTelefono = String(formData.get("responsableTelefono") || "").trim();
  const responsableCorreo = String(formData.get("responsableCorreo") || "").trim().toLowerCase();

  if (!unidadAcademica || !name || !animal || !color || !responsableNombre || !responsableCorreo) {
    throw new Error("Faltan campos obligatorios.");
  }

  const session = await auth();
  let leaderId = (session?.user as any)?.id || null;

  // Si no hay sesión o el usuario no existe todavía, lo creamos como JEFE_GRUPO
  if (!leaderId) {
    const existingUser = await db.user.findUnique({
      where: { email: responsableCorreo },
    });

    if (existingUser) {
      leaderId = existingUser.id;
    } else {
      const newUser = await db.user.create({
        data: {
          name: responsableNombre,
          email: responsableCorreo,
          role: UserRole.JEFE_GRUPO,
        },
      });

      leaderId = newUser.id;
    }
  }

  const team = await db.team.create({
    data: {
      editionId: edition.id,
      unidadAcademica,
      name,
      animal,
      color,
      responsableNombre,
      responsableTelefono,
      responsableCorreo,
      leaderId,
    },
  });

  redirect(`/semana-cultural/equipos/${team.id}`);
}