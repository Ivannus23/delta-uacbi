"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getActiveEdition } from "@/lib/semana-cultural";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const allowedUnidadesAcademicas = new Set(["UAE", "UACBI"]);

const allowedAnimales = new Set([
  "Jaguar",
  "Ocelote",
  "Capibara",
  "Perezoso de tres dedos",
  "Mono capuchino",
  "Kinkaju",
  "Coati",
  "Tapir amazonico",
  "Delfin rosado del Amazonas",
  "Guacamaya roja",
  "Tucan toco",
  "Quetzal",
  "Gallito de las rocas",
  "Colibri",
  "Loro amazonico",
  "Aguila harpia",
  "Flamenco",
  "Mariposa morpho azul",
  "Mariposa monarca",
  "Escarabajo hercules",
  "Escarabajo rinoceronte",
  "Hormiga bala",
  "Mantis religiosa",
  "Tarantula",
  "Rana dardo venenosa",
  "Rana de ojos rojos",
  "Anaconda verde",
  "Boa constrictora",
  "Iguana verde",
  "Basilisco",
  "Camaleon",
  "Tortuga charapa",
  "Caiman",
  "Okapi",
  "Cacomixtle",
  "Guacamayo azul",
]);

export async function createTeam(formData: FormData) {
  const edition = await getActiveEdition();
  if (!edition) {
    throw new Error("No hay una edición activa.");
  }

  const session = await auth();
  const sessionUser = session?.user;

  if (!sessionUser?.email) {
    redirect("/login?redirectTo=/semana-cultural/registro");
  }

  const unidadAcademica = String(formData.get("unidadAcademica") || "").trim();
  const animal = String(formData.get("animal") || "").trim();
  const color = String(formData.get("color") || "").trim();
  const responsableNombre = String(formData.get("responsableNombre") || "").trim();
  const responsableTelefono = String(formData.get("responsableTelefono") || "").trim();
  const responsableCorreo = sessionUser.email.toLowerCase();

  if (!unidadAcademica || !animal || !color || !responsableNombre) {
    throw new Error("Faltan campos obligatorios.");
  }

  if (!allowedUnidadesAcademicas.has(unidadAcademica)) {
    throw new Error("La unidad academica seleccionada no es valida.");
  }

  if (!allowedAnimales.has(animal)) {
    throw new Error("El animal seleccionado no es valido.");
  }

  const expectedTeamName = animal;

  const sessionUserId =
    typeof sessionUser === "object" &&
    sessionUser !== null &&
    "id" in sessionUser &&
    typeof sessionUser.id === "string"
      ? sessionUser.id
      : null;

  let leaderId = sessionUserId;

  if (!leaderId) {
    const existingUser = await db.user.findUnique({
      where: { email: responsableCorreo },
    });

    if (existingUser) {
      leaderId = existingUser.id;
    } else {
      const newUser = await db.user.create({
        data: {
          name: sessionUser.name || responsableNombre,
          email: responsableCorreo,
          role: UserRole.JEFE_GRUPO,
        },
      });

      leaderId = newUser.id;
    }
  }

  const existingTeam = await db.team.findFirst({
    where: {
      editionId: edition.id,
      OR: [
        ...(leaderId ? [{ leaderId }] : []),
        { responsableCorreo },
      ],
    },
    select: {
      id: true,
    },
  });

  if (existingTeam) {
    redirect(`/semana-cultural/equipos/${existingTeam.id}`);
  }

  const duplicateAnimalTeam = await db.team.findFirst({
    where: {
      editionId: edition.id,
      OR: [{ name: expectedTeamName }, { animal }],
    },
    select: {
      id: true,
    },
  });

  if (duplicateAnimalTeam) {
    throw new Error("Ya existe un equipo registrado con ese nombre o animal en esta edicion.");
  }

  const team = await db.team.create({
    data: {
      editionId: edition.id,
      unidadAcademica,
      name: expectedTeamName,
      animal,
      color,
      responsableNombre,
      responsableTelefono,
      responsableCorreo,
      leaderId,
    },
  });

  revalidatePath("/semana-cultural/registro");
  revalidatePath("/semana-cultural/admin/equipos");
  revalidatePath("/semana-cultural/ranking");
  revalidatePath("/semana-cultural/resultados");
  revalidatePath("/semana-cultural/admin/dashboard");

  redirect(`/semana-cultural/equipos/${team.id}`);
}
