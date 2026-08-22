"use server";

import { auth } from "@/auth";
import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import {
  getEditionMemberKeys,
  normalizeInstitutionalEmail,
  sanitizeMatricula,
} from "@/lib/semana-cultural-config";
import { getActiveEdition } from "@/lib/semana-cultural";
import { resolveTeamNameOptionId } from "@/lib/semana-cultural-catalog";
import { resolveAcademicProgramCode, resolveAcademicUnitCode } from "@/lib/academic-catalog";
import { Prisma, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const MATRICULA_REGEX = /^[A-Za-z0-9-]{4,32}$/;

export type CreateTeamState = {
  status: "idle" | "success" | "error";
  message: string;
  teamId: string | null;
};

function isUniqueTargetMatch(target: string[], ...expectedTokens: string[]) {
  return expectedTokens.every((token) => target.some((value) => value.includes(token)));
}

function isRedirectError(error: unknown): error is { digest: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

async function findExistingTeamByLeaderOrCorreo(params: {
  editionId: string;
  leaderId: string | null;
  responsableCorreo: string;
}) {
  return db.team.findFirst({
    where: {
      editionId: params.editionId,
      OR: [
        ...(params.leaderId ? [{ leaderId: params.leaderId }] : []),
        { responsableCorreo: params.responsableCorreo },
      ],
    },
    select: {
      id: true,
    },
  });
}

async function createTeamInternal(
  organizationId: string,
  orgSlug: string,
  formData: FormData
): Promise<{ teamId: string }> {
  const edition = await getActiveEdition(organizationId);
  if (!edition) {
    throw new Error("No hay una edicion activa.");
  }

  const session = await auth();
  const sessionUser = session?.user;

  if (!sessionUser?.email) {
    redirect(`/login?redirectTo=/semana-cultural/${orgSlug}/registro`);
  }

  const responsableAcademicUnitRaw = String(
    formData.get("responsableAcademicUnit") || ""
  ).trim();
  const animal = String(formData.get("animal") || "").trim();
  const responsableNombre = String(formData.get("responsableNombre") || "").trim();
  const responsableTelefono = String(formData.get("responsableTelefono") || "").trim();
  const responsableMatriculaRaw = String(formData.get("responsableMatricula") || "").trim();
  const responsableGradoGrupo = String(formData.get("responsableGradoGrupo") || "").trim();
  const responsableAcademicProgramRaw = String(
    formData.get("responsableAcademicProgram") || ""
  ).trim();
  const responsableCorreo = normalizeInstitutionalEmail(sessionUser.email);

  const missingFields: string[] = [];

  if (!animal) {
    missingFields.push("animal");
  }
  if (!responsableNombre) {
    missingFields.push("nombre del responsable");
  }
  if (!responsableTelefono) {
    missingFields.push("telefono");
  }
  if (!responsableMatriculaRaw) {
    missingFields.push("matricula");
  }
  if (!responsableGradoGrupo) {
    missingFields.push("grado y grupo");
  }
  if (!responsableAcademicUnitRaw) {
    missingFields.push("unidad academica");
  }
  if (!responsableAcademicProgramRaw) {
    missingFields.push("carrera");
  }

  if (missingFields.length > 0) {
    throw new Error(`Faltan campos obligatorios: ${missingFields.join(", ")}`);
  }

  await resolveTeamNameOptionId(edition.id, animal);

  const responsableAcademicUnitCode = resolveAcademicUnitCode(responsableAcademicUnitRaw);

  const responsableMatricula = sanitizeMatricula(responsableMatriculaRaw);
  if (!MATRICULA_REGEX.test(responsableMatricula)) {
    throw new Error("La matricula del responsable no tiene un formato valido.");
  }

  const responsableAcademicProgramCode = resolveAcademicProgramCode(
    responsableAcademicUnitCode,
    responsableAcademicProgramRaw
  );

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

  const existingTeam = await findExistingTeamByLeaderOrCorreo({
    editionId: edition.id,
    leaderId,
    responsableCorreo,
  });

  if (existingTeam) {
    return {
      teamId: existingTeam.id,
    };
  }

  const teamWithAnimal = await db.team.findFirst({
    where: {
      editionId: edition.id,
      animal,
    },
    select: {
      id: true,
    },
  });

  if (teamWithAnimal) {
    throw new Error("Ese animal ya fue elegido por otro equipo.");
  }

  const { editionMatriculaKey, editionEmailKey } = getEditionMemberKeys(
    edition.id,
    responsableMatricula,
    responsableCorreo
  );

  try {
    const team = await db.$transaction(async (tx) => {
      const createdTeam = await tx.team.create({
        data: {
          editionId: edition.id,
          name: animal,
          animal,
          responsableNombre,
          responsableTelefono,
          responsableCorreo,
          responsableMatricula,
          responsableGradoGrupo,
          responsableAcademicUnitCode,
          responsableAcademicProgramCode,
          leaderId,
        },
      });

      await tx.member.create({
        data: {
          teamId: createdTeam.id,
          fullName: responsableNombre,
          matricula: responsableMatricula,
          institutionalEmail: responsableCorreo,
          gradoGrupo: responsableGradoGrupo,
          academicUnitCode: responsableAcademicUnitCode,
          academicProgramCode: responsableAcademicProgramCode,
          isLeader: true,
          editionMatriculaKey,
          editionEmailKey,
        },
      });

      return createdTeam;
    });

    await createAuditLog({
      action: "CREATE_TEAM",
      entityType: "Team",
      entityId: team.id,
      detail: `Se registro el equipo ${team.animal}`,
      editionId: edition.id,
      createdById: leaderId,
    });

    revalidatePath(`/semana-cultural/${orgSlug}/admin/equipos`);
    revalidatePath(`/semana-cultural/${orgSlug}/admin/dashboard`);
    revalidatePath(`/semana-cultural/${orgSlug}/ranking`);
    revalidatePath(`/semana-cultural/${orgSlug}/resultados`);
    revalidatePath(`/semana-cultural/${orgSlug}/registro`);

    return {
      teamId: team.id,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2011") {
        const constraint = String(error.meta?.constraint ?? "").toLowerCase();

        if (constraint.includes("responsabletelefono")) {
          throw new Error("El telefono del responsable es obligatorio.");
        }

        throw new Error(
          "Falta un dato obligatorio para registrar el equipo o hay una migracion pendiente."
        );
      }

      if (error.code !== "P2002") {
        throw new Error("No se pudo registrar el equipo. Intentalo nuevamente.");
      }

      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.map((value) => String(value))
        : [];

      if (
        isUniqueTargetMatch(target, "editionId", "leaderId") ||
        target.some((value) => value.includes("Team_editionId_leaderId_key"))
      ) {
        const teamByLeader = await findExistingTeamByLeaderOrCorreo({
          editionId: edition.id,
          leaderId,
          responsableCorreo,
        });

        if (teamByLeader) {
          return {
            teamId: teamByLeader.id,
          };
        }

        throw new Error("Ya registraste un equipo en esta edicion.");
      }

      if (
        isUniqueTargetMatch(target, "editionId", "responsableCorreo") ||
        target.some((value) => value.includes("Team_editionId_responsableCorreo_key"))
      ) {
        const teamByCorreo = await db.team.findFirst({
          where: {
            editionId: edition.id,
            responsableCorreo,
          },
          select: { id: true },
        });

        if (teamByCorreo) {
          return {
            teamId: teamByCorreo.id,
          };
        }

        throw new Error("Ya existe un equipo registrado con este correo en esta edicion.");
      }

      if (
        target.some((value) => value.includes("editionMatriculaKey")) ||
        target.some((value) => value.includes("Member_editionMatriculaKey_key"))
      ) {
        throw new Error("La matricula del responsable ya esta registrada en esta edicion.");
      }

      if (
        target.some((value) => value.includes("editionEmailKey")) ||
        target.some((value) => value.includes("Member_editionEmailKey_key"))
      ) {
        throw new Error(
          "El correo institucional del responsable ya esta registrado como participante en esta edicion."
        );
      }

      if (
        isUniqueTargetMatch(target, "editionId", "animal") ||
        target.some((value) => value.includes("Team_editionId_animal_key")) ||
        isUniqueTargetMatch(target, "editionId", "name") ||
        target.some((value) => value.includes("Team_editionId_name_key"))
      ) {
        throw new Error("Ese animal ya fue elegido por otro equipo.");
      }

      throw new Error(
        "No se pudo registrar el equipo por un conflicto de datos. Verifica la informacion e intentalo nuevamente."
      );
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("No se pudo registrar el equipo. Intentalo nuevamente.");
  }
}

export async function createTeamWithState(
  organizationId: string,
  orgSlug: string,
  _prevState: CreateTeamState,
  formData: FormData
): Promise<CreateTeamState> {
  try {
    const { teamId } = await createTeamInternal(organizationId, orgSlug, formData);
    return {
      status: "success",
      message: "Equipo registrado correctamente.",
      teamId,
    };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return {
      status: "error",
      message: error instanceof Error ? error.message : "No se pudo registrar el equipo.",
      teamId: null,
    };
  }
}
