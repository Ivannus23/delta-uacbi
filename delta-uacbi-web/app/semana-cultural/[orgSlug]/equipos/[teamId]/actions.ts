"use server";

import { auth } from "@/auth";
import { createAuditLog } from "@/lib/audit";
import { getOrgRole, getSessionUserInfo } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getEditionMemberKeys,
  MAX_TEAM_MEMBERS,
  normalizeInstitutionalEmail,
  sanitizeMatricula,
} from "@/lib/semana-cultural-config";
import { getActiveEdition } from "@/lib/semana-cultural";
import { resolveAcademicProgramCode, resolveAcademicUnitCode } from "@/lib/academic-catalog";
import { initiateTeamPaymentCheckout, simulateTeamPaymentPaid } from "@/lib/semana-cultural-payments";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const MIN_FULL_NAME_LENGTH = 5;
const MATRICULA_REGEX = /^(?!.*\s)[A-Za-z0-9-]{4,32}$/;
const INSTITUTIONAL_EMAIL_REGEX = /^[a-z0-9._%+-]+@uan\.edu\.mx$/i;

type BulkMemberInput = {
  fullName: string;
  matricula: string;
  institutionalEmail: string;
  gradoGrupo: string;
  academicUnitCode: string;
  academicProgramCode: string;
};

export type BulkMembersState = {
  status: "idle" | "success" | "error";
  message: string;
};

type DuplicateScope = "captura" | "edicion";

function normalizeDuplicateValues(values: Iterable<string>) {
  return Array.from(new Set(Array.from(values).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" })
  );
}

function formatMatriculaDuplicateMessage(values: Iterable<string>, scope: DuplicateScope) {
  const normalized = normalizeDuplicateValues(values);
  if (!normalized.length) {
    return null;
  }

  if (scope === "captura") {
    return normalized.length === 1
      ? `La matricula ${normalized[0]} esta duplicada en la captura.`
      : `Las matriculas ${normalized.join(", ")} estan duplicadas en la captura.`;
  }

  return normalized.length === 1
    ? `La matricula ${normalized[0]} ya esta registrada en esta edicion.`
    : `Las matriculas ${normalized.join(", ")} ya estan registradas en esta edicion.`;
}

function formatEmailDuplicateMessage(values: Iterable<string>, scope: DuplicateScope) {
  const normalized = normalizeDuplicateValues(values);
  if (!normalized.length) {
    return null;
  }

  if (scope === "captura") {
    return normalized.length === 1
      ? `El correo ${normalized[0]} esta duplicado en la captura.`
      : `Los correos ${normalized.join(", ")} estan duplicados en la captura.`;
  }

  return normalized.length === 1
    ? `El correo ${normalized[0]} ya esta registrado en esta edicion.`
    : `Los correos ${normalized.join(", ")} ya estan registrados en esta edicion.`;
}

function formatCombinedDuplicateMessage(params: {
  matriculas: Iterable<string>;
  emails: Iterable<string>;
  scope: DuplicateScope;
}) {
  const messages = [
    formatMatriculaDuplicateMessage(params.matriculas, params.scope),
    formatEmailDuplicateMessage(params.emails, params.scope),
  ].filter((message): message is string => Boolean(message));

  if (!messages.length) {
    return null;
  }

  return messages.join(" ");
}

function validateMemberFields(params: {
  fullName: string;
  matriculaRaw: string;
  institutionalEmailRaw: string;
  gradoGrupo: string;
  academicUnitCodeRaw: string;
  academicProgramCodeRaw: string;
}) {
  const fullName = params.fullName.trim();
  const matricula = sanitizeMatricula(params.matriculaRaw);
  const institutionalEmail = normalizeInstitutionalEmail(params.institutionalEmailRaw);
  const gradoGrupo = params.gradoGrupo.trim();

  if (!fullName || !matricula || !institutionalEmail || !gradoGrupo) {
    throw new Error("Faltan campos obligatorios del integrante.");
  }

  if (fullName.length < MIN_FULL_NAME_LENGTH) {
    throw new Error("El nombre completo debe tener al menos 5 caracteres.");
  }

  if (!MATRICULA_REGEX.test(matricula)) {
    throw new Error("La matricula solo puede contener letras, numeros y guiones (sin espacios).");
  }

  if (!INSTITUTIONAL_EMAIL_REGEX.test(institutionalEmail)) {
    throw new Error("El correo institucional debe terminar en @uan.edu.mx.");
  }

  const academicUnitCode = resolveAcademicUnitCode(params.academicUnitCodeRaw);
  const academicProgramCode = resolveAcademicProgramCode(academicUnitCode, params.academicProgramCodeRaw);

  return {
    fullName,
    matricula,
    institutionalEmail,
    gradoGrupo,
    academicUnitCode,
    academicProgramCode,
  };
}

function assertCanManageTeam(params: {
  orgRole: string | null;
  sessionUserId: string | null;
  sessionEmail: string | null;
  leaderId: string | null;
  responsableCorreo: string;
}) {
  const isLeader =
    Boolean(params.sessionUserId && params.leaderId === params.sessionUserId) ||
    (params.sessionEmail !== null &&
      params.responsableCorreo.toLowerCase() === params.sessionEmail.toLowerCase());

  const isOrgStaff = params.orgRole === "ADMIN" || params.orgRole === "STAFF";
  const canManage = isOrgStaff || isLeader;
  if (!canManage) {
    throw new Error("No tienes permisos para administrar este equipo.");
  }
}

function revalidateTeamPaths(orgSlug: string, teamId: string) {
  const base = `/semana-cultural/${orgSlug}`;
  revalidatePath(`${base}/equipos/${teamId}`);
  revalidatePath(`${base}/mi-equipo`);
  revalidatePath(`${base}/admin/equipos`);
  revalidatePath(`${base}/admin/actividades`);
  revalidatePath(`${base}/admin/dashboard`);
  revalidatePath(`${base}/ranking`);
  revalidatePath(`${base}/resultados`);
}

function normalizeMemberConstraintError(error: Prisma.PrismaClientKnownRequestError) {
  if (error.code === "P2011") {
    return new Error("Falta un dato obligatorio del integrante.");
  }

  if (error.code !== "P2002") {
    return new Error("No se pudo registrar al integrante. Intentalo nuevamente.");
  }

  const target = Array.isArray(error.meta?.target)
    ? error.meta.target.map((value) => String(value))
    : [];

  if (
    target.some((value) => value.includes("editionMatriculaKey")) ||
    target.some((value) => value.includes("Member_editionMatriculaKey_key"))
  ) {
    return new Error("Ya existe un integrante con esa matricula en esta edicion.");
  }
  if (
    target.some((value) => value.includes("editionEmailKey")) ||
    target.some((value) => value.includes("Member_editionEmailKey_key"))
  ) {
    return new Error("Ya existe un integrante con ese correo institucional en esta edicion.");
  }
  if (
    target.some((value) => value.includes("teamId")) &&
    target.some((value) => value.includes("matricula"))
  ) {
    return new Error("La matricula ya esta registrada en este equipo.");
  }

  return new Error("No se pudo registrar al integrante por un conflicto de datos.");
}

function parseBulkMembersPayload(rawPayload: FormDataEntryValue | null): BulkMemberInput[] {
  const payloadText = String(rawPayload || "").trim();
  if (!payloadText) {
    throw new Error("No hay integrantes para guardar.");
  }

  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(payloadText);
  } catch {
    throw new Error("El formato de captura masiva no es valido.");
  }

  if (!Array.isArray(parsedPayload)) {
    throw new Error("El formato de captura masiva no es valido.");
  }

  const members = parsedPayload
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const fullName = String((item as Record<string, unknown>).fullName || "").trim();
      const matricula = String((item as Record<string, unknown>).matricula || "").trim();
      const institutionalEmail = String(
        (item as Record<string, unknown>).institutionalEmail || ""
      ).trim();
      const gradoGrupo = String((item as Record<string, unknown>).gradoGrupo || "").trim();
      const academicUnitCode = String((item as Record<string, unknown>).academicUnitCode || "").trim();
      const academicProgramCode = String(
        (item as Record<string, unknown>).academicProgramCode || ""
      ).trim();

      const isCoreRowEmpty = !fullName && !matricula && !institutionalEmail && !gradoGrupo;
      if (isCoreRowEmpty) {
        return null;
      }

      const hasIncompleteCore = !fullName || !matricula || !institutionalEmail || !gradoGrupo;
      if (hasIncompleteCore) {
        throw new Error("Hay filas incompletas.");
      }

      return {
        fullName,
        matricula,
        institutionalEmail,
        gradoGrupo,
        academicUnitCode,
        academicProgramCode,
      } satisfies BulkMemberInput;
    })
    .filter((item): item is BulkMemberInput => Boolean(item));

  if (!members.length) {
    throw new Error("No hay integrantes para guardar.");
  }

  return members;
}

export async function addMember(
  organizationId: string,
  orgSlug: string,
  teamId: string,
  formData: FormData
) {
  const edition = await getActiveEdition(organizationId);
  if (!edition) {
    throw new Error("No hay una edicion activa.");
  }

  const session = await auth();
  const sessionUser = session?.user;
  if (!sessionUser) {
    redirect("/login");
  }

  const { role: platformRole, id: sessionUserId, email: sessionEmail } = getSessionUserInfo(sessionUser);
  const orgRole = await getOrgRole(organizationId, sessionUserId, platformRole);

  const fullNameRaw = String(formData.get("fullName") || "").trim();
  const matriculaRaw = String(formData.get("matricula") || "").trim();
  const institutionalEmailRaw = String(formData.get("institutionalEmail") || "").trim();
  const gradoGrupoRaw = String(formData.get("gradoGrupo") || "").trim();
  const academicUnitRaw = String(formData.get("academicUnit") || "").trim();
  const academicProgramRaw = String(formData.get("academicProgram") || "").trim();

  let managedTeamId = teamId;

  try {
    const result = await db.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id
        FROM "Team"
        WHERE id = ${teamId} AND "editionId" = ${edition.id}
        FOR UPDATE
      `;

      const team = await tx.team.findFirst({
        where: {
          id: teamId,
          editionId: edition.id,
        },
        select: {
          id: true,
          animal: true,
          leaderId: true,
          responsableCorreo: true,
        },
      });

      if (!team) {
        throw new Error("Equipo no encontrado.");
      }

      assertCanManageTeam({
        orgRole,
        sessionUserId,
        sessionEmail,
        leaderId: team.leaderId,
        responsableCorreo: team.responsableCorreo,
      });

      const memberCount = await tx.member.count({
        where: { teamId: team.id },
      });

      if (memberCount >= MAX_TEAM_MEMBERS) {
        throw new Error(`Este equipo ya alcanzo el limite de ${MAX_TEAM_MEMBERS} participantes.`);
      }

      const validatedMember = validateMemberFields({
        fullName: fullNameRaw,
        matriculaRaw,
        institutionalEmailRaw,
        gradoGrupo: gradoGrupoRaw,
        academicUnitCodeRaw: academicUnitRaw,
        academicProgramCodeRaw: academicProgramRaw,
      });

      const { editionMatriculaKey, editionEmailKey } = getEditionMemberKeys(
        edition.id,
        validatedMember.matricula,
        validatedMember.institutionalEmail
      );

      const member = await tx.member.create({
        data: {
          teamId: team.id,
          fullName: validatedMember.fullName,
          matricula: validatedMember.matricula,
          institutionalEmail: validatedMember.institutionalEmail,
          gradoGrupo: validatedMember.gradoGrupo,
          academicUnitCode: validatedMember.academicUnitCode,
          academicProgramCode: validatedMember.academicProgramCode,
          isLeader: false,
          editionMatriculaKey,
          editionEmailKey,
        },
      });

      return {
        team,
        member,
      };
    });

    managedTeamId = result.team.id;

    await createAuditLog({
      action: "ADD_MEMBER",
      entityType: "Member",
      entityId: result.member.id,
      detail: `Se agrego a ${result.member.fullName} en ${result.team.animal}`,
      editionId: edition.id,
      createdById: sessionUserId,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw normalizeMemberConstraintError(error);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("No se pudo registrar al integrante. Intentalo nuevamente.");
  }

  revalidateTeamPaths(orgSlug, managedTeamId);
}

export async function bulkAddMembers(
  organizationId: string,
  orgSlug: string,
  teamId: string,
  formData: FormData
) {
  const edition = await getActiveEdition(organizationId);
  if (!edition) {
    throw new Error("No hay una edicion activa.");
  }

  const session = await auth();
  const sessionUser = session?.user;
  if (!sessionUser) {
    redirect("/login");
  }

  const { role: platformRole, id: sessionUserId, email: sessionEmail } = getSessionUserInfo(sessionUser);
  const orgRole = await getOrgRole(organizationId, sessionUserId, platformRole);
  const bulkMembers = parseBulkMembersPayload(formData.get("membersJson"));

  const duplicateMatriculas = new Set<string>();
  const duplicateEmails = new Set<string>();
  const localMatriculas = new Set<string>();
  const localEmails = new Set<string>();

  try {
    const result = await db.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id
        FROM "Team"
        WHERE id = ${teamId} AND "editionId" = ${edition.id}
        FOR UPDATE
      `;

      const team = await tx.team.findFirst({
        where: {
          id: teamId,
          editionId: edition.id,
        },
        select: {
          id: true,
          animal: true,
          leaderId: true,
          responsableCorreo: true,
        },
      });

      if (!team) {
        throw new Error("Equipo no encontrado.");
      }

      assertCanManageTeam({
        orgRole,
        sessionUserId,
        sessionEmail,
        leaderId: team.leaderId,
        responsableCorreo: team.responsableCorreo,
      });

      const currentCount = await tx.member.count({
        where: { teamId: team.id },
      });

      if (currentCount >= MAX_TEAM_MEMBERS) {
        throw new Error(`Este equipo ya alcanzo el limite de ${MAX_TEAM_MEMBERS} participantes.`);
      }

      const remainingSlots = MAX_TEAM_MEMBERS - currentCount;
      if (bulkMembers.length > remainingSlots) {
        throw new Error(`El equipo superaria el maximo de ${MAX_TEAM_MEMBERS} participantes.`);
      }

      const matriculaByEditionKey = new Map<string, string>();
      const emailByEditionKey = new Map<string, string>();

      const preparedMembers = [];
      for (const member of bulkMembers) {
        const validatedMember = validateMemberFields({
          fullName: member.fullName,
          matriculaRaw: member.matricula,
          institutionalEmailRaw: member.institutionalEmail,
          gradoGrupo: member.gradoGrupo,
          academicUnitCodeRaw: member.academicUnitCode,
          academicProgramCodeRaw: member.academicProgramCode,
        });

        const { editionMatriculaKey, editionEmailKey } = getEditionMemberKeys(
          edition.id,
          validatedMember.matricula,
          validatedMember.institutionalEmail
        );

        if (localMatriculas.has(editionMatriculaKey)) {
          duplicateMatriculas.add(validatedMember.matricula);
        }
        if (localEmails.has(editionEmailKey)) {
          duplicateEmails.add(validatedMember.institutionalEmail);
        }

        localMatriculas.add(editionMatriculaKey);
        localEmails.add(editionEmailKey);
        matriculaByEditionKey.set(editionMatriculaKey, validatedMember.matricula);
        emailByEditionKey.set(editionEmailKey, validatedMember.institutionalEmail);

        preparedMembers.push({
          teamId: team.id,
          fullName: validatedMember.fullName,
          matricula: validatedMember.matricula,
          institutionalEmail: validatedMember.institutionalEmail,
          gradoGrupo: validatedMember.gradoGrupo,
          academicUnitCode: validatedMember.academicUnitCode,
          academicProgramCode: validatedMember.academicProgramCode,
          isLeader: false,
          editionMatriculaKey,
          editionEmailKey,
        });
      }

      const duplicateInBatchMessage = formatCombinedDuplicateMessage({
        matriculas: duplicateMatriculas,
        emails: duplicateEmails,
        scope: "captura",
      });
      if (duplicateInBatchMessage) {
        throw new Error(duplicateInBatchMessage);
      }

      const editionMatriculaKeys = preparedMembers.map((member) => member.editionMatriculaKey);
      const editionEmailKeys = preparedMembers.map((member) => member.editionEmailKey);

      const conflicts = await tx.member.findMany({
        where: {
          OR: [
            { editionMatriculaKey: { in: editionMatriculaKeys } },
            { editionEmailKey: { in: editionEmailKeys } },
          ],
        },
        select: {
          editionMatriculaKey: true,
          editionEmailKey: true,
        },
      });

      const conflictingMatriculas = new Set<string>();
      const conflictingEmails = new Set<string>();

      for (const conflict of conflicts) {
        const conflictingMatricula = matriculaByEditionKey.get(conflict.editionMatriculaKey);
        const conflictingEmail = emailByEditionKey.get(conflict.editionEmailKey);

        if (conflictingMatricula) {
          conflictingMatriculas.add(conflictingMatricula);
        }
        if (conflictingEmail) {
          conflictingEmails.add(conflictingEmail);
        }
      }

      const responsablesInEdition = await tx.team.findMany({
        where: { editionId: edition.id },
        select: {
          responsableMatricula: true,
          responsableCorreo: true,
        },
      });

      for (const responsable of responsablesInEdition) {
        if (responsable.responsableMatricula) {
          const { editionMatriculaKey } = getEditionMemberKeys(
            edition.id,
            responsable.responsableMatricula,
            "placeholder@uan.edu.mx"
          );
          const conflictingMatricula = matriculaByEditionKey.get(editionMatriculaKey);
          if (conflictingMatricula) {
            conflictingMatriculas.add(conflictingMatricula);
          }
        }

        const { editionEmailKey } = getEditionMemberKeys(
          edition.id,
          "PLACEHOLDER",
          responsable.responsableCorreo
        );
        const conflictingEmail = emailByEditionKey.get(editionEmailKey);
        if (conflictingEmail) {
          conflictingEmails.add(conflictingEmail);
        }
      }

      const duplicateInEditionMessage = formatCombinedDuplicateMessage({
        matriculas: conflictingMatriculas,
        emails: conflictingEmails,
        scope: "edicion",
      });
      if (duplicateInEditionMessage) {
        throw new Error(duplicateInEditionMessage);
      }

      const created = await tx.member.createMany({
        data: preparedMembers,
      });

      return {
        team,
        createdCount: created.count,
      };
    });

    await createAuditLog({
      action: "BULK_ADD_MEMBERS",
      entityType: "Team",
      entityId: result.team.id,
      detail: `Se agregaron ${result.createdCount} integrantes en ${result.team.animal}`,
      editionId: edition.id,
      createdById: sessionUserId,
    });

    revalidateTeamPaths(orgSlug, result.team.id);
    return result.createdCount;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw normalizeMemberConstraintError(error);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("No se pudo completar la captura masiva de integrantes.");
  }
}

export async function bulkAddMembersWithState(
  organizationId: string,
  orgSlug: string,
  teamId: string,
  _prevState: BulkMembersState,
  formData: FormData
): Promise<BulkMembersState> {
  try {
    const createdCount = await bulkAddMembers(organizationId, orgSlug, teamId, formData);
    if (!createdCount) {
      return {
        status: "error",
        message: "No hay integrantes para guardar.",
      };
    }
    return {
      status: "success",
      message: "Integrantes guardados correctamente.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No se pudo guardar la captura masiva.",
    };
  }
}

export async function removeMember(
  organizationId: string,
  orgSlug: string,
  teamId: string,
  memberId: string
) {
  const edition = await getActiveEdition(organizationId);
  if (!edition) {
    throw new Error("No hay una edicion activa.");
  }

  const session = await auth();
  const sessionUser = session?.user;
  if (!sessionUser) {
    redirect("/login");
  }

  const { role: platformRole, id: sessionUserId, email: sessionEmail } = getSessionUserInfo(sessionUser);
  const orgRole = await getOrgRole(organizationId, sessionUserId, platformRole);

  const deletedMember = await db.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT id
      FROM "Team"
      WHERE id = ${teamId} AND "editionId" = ${edition.id}
      FOR UPDATE
    `;

    const team = await tx.team.findFirst({
      where: {
        id: teamId,
        editionId: edition.id,
      },
      select: {
        id: true,
        animal: true,
        leaderId: true,
        responsableCorreo: true,
      },
    });

    if (!team) {
      throw new Error("Equipo no encontrado.");
    }

    assertCanManageTeam({
      orgRole,
      sessionUserId,
      sessionEmail,
      leaderId: team.leaderId,
      responsableCorreo: team.responsableCorreo,
    });

    const member = await tx.member.findFirst({
      where: {
        id: memberId,
        teamId: team.id,
      },
      select: {
        id: true,
        fullName: true,
        isLeader: true,
      },
    });

    if (!member) {
      throw new Error("Integrante no encontrado en este equipo.");
    }

    if (member.isLeader) {
      throw new Error("No puedes eliminar al encargado del equipo desde esta lista.");
    }

    await tx.member.delete({
      where: { id: member.id },
    });

    return {
      member,
      team,
    };
  });

  await createAuditLog({
    action: "REMOVE_MEMBER",
    entityType: "Member",
    entityId: deletedMember.member.id,
    detail: `Se elimino a ${deletedMember.member.fullName} de ${deletedMember.team.animal}`,
    editionId: edition.id,
    createdById: sessionUserId,
  });

  revalidateTeamPaths(orgSlug, deletedMember.team.id);
}

export async function initiateTeamPaymentCheckoutAction(
  organizationId: string,
  orgSlug: string,
  teamId: string
) {
  const edition = await getActiveEdition(organizationId);
  if (!edition) {
    throw new Error("No hay una edicion activa.");
  }

  const session = await auth();
  const sessionUser = session?.user;
  if (!sessionUser) {
    redirect("/login");
  }

  const { role: platformRole, id: sessionUserId, email: sessionEmail } = getSessionUserInfo(sessionUser);
  const orgRole = await getOrgRole(organizationId, sessionUserId, platformRole);

  const team = await db.team.findFirst({
    where: { id: teamId, editionId: edition.id },
  });
  if (!team) {
    throw new Error("Equipo no encontrado.");
  }

  assertCanManageTeam({
    orgRole,
    sessionUserId,
    sessionEmail,
    leaderId: team.leaderId,
    responsableCorreo: team.responsableCorreo,
  });

  const { checkoutUrl } = await initiateTeamPaymentCheckout(edition, team, orgSlug);
  redirect(checkoutUrl);
}

export async function simulateTeamPaymentPaidAction(
  organizationId: string,
  orgSlug: string,
  teamId: string
) {
  const edition = await getActiveEdition(organizationId);
  if (!edition) {
    throw new Error("No hay una edicion activa.");
  }

  const session = await auth();
  const sessionUser = session?.user;
  if (!sessionUser) {
    redirect("/login");
  }

  const { role: platformRole, id: sessionUserId, email: sessionEmail } = getSessionUserInfo(sessionUser);
  const orgRole = await getOrgRole(organizationId, sessionUserId, platformRole);

  const team = await db.team.findFirst({
    where: { id: teamId, editionId: edition.id },
  });
  if (!team) {
    throw new Error("Equipo no encontrado.");
  }

  assertCanManageTeam({
    orgRole,
    sessionUserId,
    sessionEmail,
    leaderId: team.leaderId,
    responsableCorreo: team.responsableCorreo,
  });

  await simulateTeamPaymentPaid(edition, team);
  revalidateTeamPaths(orgSlug, team.id);
}
