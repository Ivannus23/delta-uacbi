import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  AcademicProgram,
  AcademicUnit,
  PrismaClient,
  TeamStatus,
  UserRole,
} from "@prisma/client";
import {
  MAX_TEAM_MEMBERS,
  getAcademicProgramLabel,
  getEditionMemberKeys,
  normalizeInstitutionalEmail,
  SEMANA_CULTURAL_ANIMALES,
  UACBI_ACADEMIC_PROGRAMS,
  UAE_ACADEMIC_PROGRAM,
} from "../lib/semana-cultural-config";

const CONFIRM_ENV = "CONFIRM_SEMANA_TEST_SEED";
const TEAM_TARGET_COUNT = 24;
const TARGET_MEMBERS_PER_TEAM = MAX_TEAM_MEMBERS;
const TEST_NAME_PREFIX = "[SC-TEST]";
const TEST_EMAIL_DOMAIN = "sc-test.local";
const MEMBER_NAME_PREFIX = "Integrante Prueba";
const TEST_MATRICULA_PREFIX = "TEST";
const TEST_GRADO_GRUPO = "TEST-1A";
const TEST_RESPONSABLE_MATRICULA_PREFIX = "TEST-RESP";

type TeamProfile = "UAE" | "UACBI" | "MIXTO";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL no esta definida.");
}

const adapter = new PrismaPg({ connectionString });
const db = new PrismaClient({ adapter, log: ["error", "warn"] });

function assertSafetyGuard() {
  if (process.env[CONFIRM_ENV] !== "true") {
    throw new Error(`Falta confirmacion. Ejecuta con ${CONFIRM_ENV}=true para continuar.`);
  }

  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
    throw new Error("Este script esta bloqueado en entorno de produccion.");
  }
}

function getTestTeamWhereInput() {
  return {
    OR: [
      { responsableNombre: { startsWith: TEST_NAME_PREFIX } },
      { responsableCorreo: { endsWith: `@${TEST_EMAIL_DOMAIN}` } },
    ],
  };
}

function findDuplicates(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => value);
}

function formatSequence(value: number, length = 3) {
  return String(value).padStart(length, "0");
}

function getAnimalTokens(animal: string, teamId: string) {
  const normalized = animal
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const emailToken = normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const matriculaToken = normalized
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");

  return {
    emailToken: emailToken || `team-${teamId.slice(0, 6).toLowerCase()}`,
    matriculaToken: matriculaToken || `TEAM${teamId.slice(0, 6).toUpperCase()}`,
  };
}

function getProgramForUnit(unit: AcademicUnit, index: number): AcademicProgram {
  if (unit === AcademicUnit.UAE) {
    return UAE_ACADEMIC_PROGRAM;
  }
  return UACBI_ACADEMIC_PROGRAMS[index % UACBI_ACADEMIC_PROGRAMS.length];
}

function getTeamProfile(index: number): TeamProfile {
  const mod = index % 3;
  if (mod === 0) return "MIXTO";
  if (mod === 1) return "UAE";
  return "UACBI";
}

function getProfileTag(profile: TeamProfile) {
  return `[${profile}]`;
}

function parseProfileTagFromName(name: string): TeamProfile | null {
  if (name.includes("[MIXTO]")) return "MIXTO";
  if (name.includes("[UAE]")) return "UAE";
  if (name.includes("[UACBI]")) return "UACBI";
  return null;
}

function getUnitForProfile(profile: TeamProfile, sequence: number): AcademicUnit {
  if (profile === "UAE") return AcademicUnit.UAE;
  if (profile === "UACBI") return AcademicUnit.UACBI;
  return sequence % 2 === 0 ? AcademicUnit.UAE : AcademicUnit.UACBI;
}

function usage() {
  console.log("Uso:");
  console.log(`${CONFIRM_ENV}=true npx tsx scripts/seed-semana-cultural-test.ts seed`);
  console.log(`${CONFIRM_ENV}=true npx tsx scripts/seed-semana-cultural-test.ts members`);
  console.log(`${CONFIRM_ENV}=true npx tsx scripts/seed-semana-cultural-test.ts cleanup`);
  console.log(`${CONFIRM_ENV}=true npx tsx scripts/seed-semana-cultural-test.ts repair-leaders`);
}

async function seedTeams() {
  const modeRunTag = Date.now().toString();
  const edition = await db.culturalEdition.findFirst({
    where: { isActive: true },
    select: { id: true, name: true, year: true },
  });

  if (!edition) {
    throw new Error("No hay edicion activa para Semana Cultural.");
  }

  const existingTestTeams = await db.team.count({
    where: {
      editionId: edition.id,
      ...getTestTeamWhereInput(),
    },
  });

  if (existingTestTeams > 0) {
    throw new Error(
      `Ya existen ${existingTestTeams} equipos de prueba en la edicion activa. Ejecuta cleanup antes de volver a sembrar.`
    );
  }

  const existingTeams = await db.team.findMany({
    where: { editionId: edition.id },
    select: { animal: true, responsableCorreo: true },
  });

  const usedAnimals = new Set(existingTeams.map((team) => team.animal));
  const availableAnimales = SEMANA_CULTURAL_ANIMALES.filter((animal) => !usedAnimals.has(animal));

  if (availableAnimales.length < TEAM_TARGET_COUNT) {
    throw new Error(
      `No hay suficientes animales disponibles. Requeridos: ${TEAM_TARGET_COUNT}, disponibles: ${availableAnimales.length}.`
    );
  }

  const animalsToUse = availableAnimales.slice(0, TEAM_TARGET_COUNT);
  const createdTeamIds: string[] = [];
  const errors: string[] = [];
  let createdUsers = 0;
  let createdTeams = 0;
  let createdLeaderMembers = 0;

  const profileSummary = new Map<TeamProfile, number>([
    ["UAE", 0],
    ["UACBI", 0],
    ["MIXTO", 0],
  ]);

  for (let index = 0; index < TEAM_TARGET_COUNT; index += 1) {
    const teamNumber = formatSequence(index + 1, 2);
    const animal = animalsToUse[index];
    const profile = getTeamProfile(index);
    const responsableAcademicUnit =
      profile === "MIXTO"
        ? index % 2 === 0
          ? AcademicUnit.UAE
          : AcademicUnit.UACBI
        : profile === "UAE"
          ? AcademicUnit.UAE
          : AcademicUnit.UACBI;
    const responsableAcademicProgram = getProgramForUnit(responsableAcademicUnit, index);
    const responsableCorreo = normalizeInstitutionalEmail(
      `sc-test-${edition.year}-${modeRunTag}-${teamNumber}@${TEST_EMAIL_DOMAIN}`
    );
    const responsableNombre = `${TEST_NAME_PREFIX} Responsable ${teamNumber} ${getProfileTag(profile)}`;
    const leaderName = `${TEST_NAME_PREFIX} Lider ${teamNumber}`;
    const responsableTelefono = `311${String(1000000 + index).padStart(7, "0")}`;
    const responsableMatricula = `${TEST_RESPONSABLE_MATRICULA_PREFIX}-${edition.year}-${teamNumber}`;
    const responsableGradoGrupo = TEST_GRADO_GRUPO;
    const { editionMatriculaKey, editionEmailKey } = getEditionMemberKeys(
      edition.id,
      responsableMatricula,
      responsableCorreo
    );

    try {
      const user = await db.user.create({
        data: {
          name: leaderName,
          email: responsableCorreo,
          role: UserRole.JEFE_GRUPO,
        },
        select: { id: true },
      });
      createdUsers += 1;

      const team = await db.$transaction(async (tx) => {
        const createdTeam = await tx.team.create({
          data: {
            editionId: edition.id,
            unidadAcademica: responsableAcademicUnit,
            name: animal,
            animal,
            responsableNombre,
            responsableTelefono,
            responsableCorreo,
            responsableMatricula,
            responsableGradoGrupo,
            responsableAcademicUnit,
            responsableAcademicProgram,
            leaderId: user.id,
            status: TeamStatus.APROBADO,
          },
          select: { id: true, animal: true },
        });

        await tx.member.create({
          data: {
            teamId: createdTeam.id,
            fullName: responsableNombre,
            matricula: responsableMatricula,
            institutionalEmail: responsableCorreo,
            gradoGrupo: responsableGradoGrupo,
            academicUnit: responsableAcademicUnit,
            academicProgram: responsableAcademicProgram,
            isLeader: true,
            editionMatriculaKey,
            editionEmailKey,
          },
        });

        return createdTeam;
      });

      createdTeams += 1;
      createdLeaderMembers += 1;
      createdTeamIds.push(team.id);
      profileSummary.set(profile, (profileSummary.get(profile) ?? 0) + 1);
    } catch (error) {
      errors.push(
        `Equipo ${teamNumber} (${animal}) -> ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      await db.user.deleteMany({ where: { email: responsableCorreo } });
    }
  }

  const createdTeamsData = await db.team.findMany({
    where: { id: { in: createdTeamIds } },
    select: { animal: true, responsableCorreo: true },
  });

  const duplicateAnimalsInCreated = findDuplicates(createdTeamsData.map((team) => team.animal));
  const duplicateEmailsInCreated = findDuplicates(
    createdTeamsData.map((team) => team.responsableCorreo)
  );

  console.log("----- Resumen seed Semana Cultural TEST -----");
  console.log(`Edicion activa: ${edition.name} (${edition.year})`);
  console.log(`Usuarios creados: ${createdUsers}`);
  console.log(`Equipos creados: ${createdTeams}`);
  console.log(`Encargados creados como participantes (isLeader=true): ${createdLeaderMembers}`);
  console.log("Composicion de equipos creados:");
  console.log(`- UAE: ${profileSummary.get("UAE") ?? 0}`);
  console.log(`- UACBI: ${profileSummary.get("UACBI") ?? 0}`);
  console.log(`- MIXTO: ${profileSummary.get("MIXTO") ?? 0}`);
  console.log(
    `Duplicados en creados -> animales: ${duplicateAnimalsInCreated.length}, correos: ${duplicateEmailsInCreated.length}`
  );

  if (errors.length > 0) {
    console.log("Errores detectados:");
    for (const error of errors) {
      console.log(`- ${error}`);
    }
  } else {
    console.log("Sin errores durante la creacion.");
  }
}

async function seedMembers() {
  const edition = await db.culturalEdition.findFirst({
    where: { isActive: true },
    select: { id: true, name: true, year: true },
  });

  if (!edition) {
    throw new Error("No hay edicion activa para Semana Cultural.");
  }

  const testTeams = await db.team.findMany({
    where: {
      editionId: edition.id,
      ...getTestTeamWhereInput(),
    },
    select: {
      id: true,
      animal: true,
      responsableNombre: true,
      responsableAcademicUnit: true,
      members: {
        select: {
          academicUnit: true,
        },
      },
    },
    orderBy: { animal: "asc" },
  });

  if (!testTeams.length) {
    throw new Error("No se encontraron equipos de prueba en la edicion activa.");
  }

  const teamIds = testTeams.map((team) => team.id);
  const existingTestMembers = await db.member.findMany({
    where: {
      teamId: { in: teamIds },
    },
    select: {
      teamId: true,
      editionMatriculaKey: true,
      editionEmailKey: true,
      academicUnit: true,
      academicProgram: true,
      isLeader: true,
    },
  });

  const allEditionMembers = await db.member.findMany({
    where: {
      editionMatriculaKey: {
        startsWith: `${edition.id}:`,
      },
    },
    select: {
      editionMatriculaKey: true,
      editionEmailKey: true,
    },
  });

  const usedEditionMatriculaKeys = new Set(
    allEditionMembers.map((member) => member.editionMatriculaKey)
  );
  const usedEditionEmailKeys = new Set(allEditionMembers.map((member) => member.editionEmailKey));

  const membersByTeam = new Map<string, typeof existingTestMembers>();
  for (const member of existingTestMembers) {
    const teamMembers = membersByTeam.get(member.teamId) ?? [];
    teamMembers.push(member);
    membersByTeam.set(member.teamId, teamMembers);
  }

  const unitTotals = new Map<AcademicUnit, number>([
    [AcademicUnit.UAE, 0],
    [AcademicUnit.UACBI, 0],
  ]);
  const programTotals = new Map<string, number>();
  const teamCompositionCounts = new Map<TeamProfile, number>([
    ["UAE", 0],
    ["UACBI", 0],
    ["MIXTO", 0],
  ]);

  const errors: string[] = [];
  let createdMembers = 0;
  let existingMembers = 0;

  for (const team of testTeams) {
    const existingMembersForTeam = membersByTeam.get(team.id) ?? [];
    const currentCount = existingMembersForTeam.length;
    existingMembers += currentCount;

    if (currentCount >= TARGET_MEMBERS_PER_TEAM) {
      continue;
    }

    const profileFromName = parseProfileTagFromName(team.responsableNombre);
    const profile: TeamProfile =
      profileFromName ??
      (team.responsableAcademicUnit === AcademicUnit.UAE ? "UAE" : "UACBI");

    const missing = TARGET_MEMBERS_PER_TEAM - currentCount;
    const { emailToken, matriculaToken } = getAnimalTokens(team.animal, team.id);

    const teamMemberKeys = new Set(existingMembersForTeam.map((member) => member.editionMatriculaKey));
    let createdForTeam = 0;
    let sequence = 1;

    while (createdForTeam < missing && sequence <= 4000) {
      const seq = formatSequence(sequence);
      sequence += 1;

      const unit = getUnitForProfile(profile, sequence);
      const program = getProgramForUnit(unit, sequence);
      const fullName = `${MEMBER_NAME_PREFIX} ${team.animal} ${seq}`;
      const matricula = `${TEST_MATRICULA_PREFIX}-${matriculaToken}-${seq}`;
      const institutionalEmail = `test.${emailToken}.${seq}@uan.edu.mx`;
      const { editionMatriculaKey, editionEmailKey } = getEditionMemberKeys(
        edition.id,
        matricula,
        institutionalEmail
      );

      if (
        usedEditionMatriculaKeys.has(editionMatriculaKey) ||
        usedEditionEmailKeys.has(editionEmailKey) ||
        teamMemberKeys.has(editionMatriculaKey)
      ) {
        continue;
      }

      try {
        await db.member.create({
          data: {
            teamId: team.id,
            fullName,
            matricula,
            institutionalEmail,
            gradoGrupo: TEST_GRADO_GRUPO,
            academicUnit: unit,
            academicProgram: program,
            isLeader: false,
            editionMatriculaKey,
            editionEmailKey,
          },
        });

        usedEditionMatriculaKeys.add(editionMatriculaKey);
        usedEditionEmailKeys.add(editionEmailKey);
        teamMemberKeys.add(editionMatriculaKey);
        createdForTeam += 1;
        createdMembers += 1;
      } catch (error) {
        errors.push(
          `Equipo ${team.animal} integrante ${seq} -> ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }

  const finalMembers = await db.member.findMany({
    where: {
      teamId: { in: teamIds },
    },
    select: {
      teamId: true,
      academicUnit: true,
      academicProgram: true,
    },
  });

  const teamUnits = new Map<string, Set<AcademicUnit>>();
  for (const member of finalMembers) {
    unitTotals.set(member.academicUnit, (unitTotals.get(member.academicUnit) ?? 0) + 1);
    const programLabel = getAcademicProgramLabel(member.academicProgram);
    programTotals.set(programLabel, (programTotals.get(programLabel) ?? 0) + 1);

    const units = teamUnits.get(member.teamId) ?? new Set<AcademicUnit>();
    units.add(member.academicUnit);
    teamUnits.set(member.teamId, units);
  }

  for (const teamId of teamIds) {
    const units = teamUnits.get(teamId) ?? new Set<AcademicUnit>();
    const profile: TeamProfile =
      units.size > 1
        ? "MIXTO"
        : units.has(AcademicUnit.UAE)
          ? "UAE"
          : units.has(AcademicUnit.UACBI)
            ? "UACBI"
            : "UACBI";
    teamCompositionCounts.set(profile, (teamCompositionCounts.get(profile) ?? 0) + 1);
  }

  console.log("----- Resumen members Semana Cultural TEST -----");
  console.log(`Edicion activa: ${edition.name} (${edition.year})`);
  console.log(`Equipos de prueba encontrados: ${testTeams.length}`);
  console.log(`Participantes existentes antes: ${existingMembers}`);
  console.log(`Participantes creados en esta ejecucion: ${createdMembers}`);
  console.log("Totales por unidad:");
  console.log(`- UAE: ${unitTotals.get(AcademicUnit.UAE) ?? 0}`);
  console.log(`- UACBI: ${unitTotals.get(AcademicUnit.UACBI) ?? 0}`);
  console.log("Totales por carrera:");
  for (const [career, count] of programTotals.entries()) {
    console.log(`- ${career}: ${count}`);
  }
  console.log("Composicion final de equipos:");
  console.log(`- UAE: ${teamCompositionCounts.get("UAE") ?? 0}`);
  console.log(`- UACBI: ${teamCompositionCounts.get("UACBI") ?? 0}`);
  console.log(`- MIXTO: ${teamCompositionCounts.get("MIXTO") ?? 0}`);

  if (errors.length > 0) {
    console.log("Errores detectados:");
    for (const error of errors) {
      console.log(`- ${error}`);
    }
  } else {
    console.log("Sin errores durante la carga de integrantes.");
  }
}

async function repairLeaders() {
  const edition = await db.culturalEdition.findFirst({
    where: { isActive: true },
    select: { id: true, name: true, year: true },
  });

  if (!edition) {
    throw new Error("No hay edicion activa para Semana Cultural.");
  }

  const teams = await db.team.findMany({
    where: { editionId: edition.id },
    select: {
      id: true,
      animal: true,
      unidadAcademica: true,
      responsableNombre: true,
      responsableCorreo: true,
      responsableMatricula: true,
      responsableGradoGrupo: true,
      responsableAcademicUnit: true,
      responsableAcademicProgram: true,
      members: {
        select: {
          id: true,
          matricula: true,
          institutionalEmail: true,
          academicUnit: true,
          academicProgram: true,
          isLeader: true,
        },
      },
    },
    orderBy: { animal: "asc" },
  });

  let createdLeaders = 0;
  let updatedLeaders = 0;
  const errors: string[] = [];

  for (const team of teams) {
    if (team.members.some((member) => member.isLeader)) {
      continue;
    }

    if (!team.responsableMatricula || !team.responsableGradoGrupo) {
      errors.push(`Equipo ${team.animal}: faltan datos de responsable para reparar lider.`);
      continue;
    }

    const unit =
      team.responsableAcademicUnit ??
      (team.unidadAcademica === "UAE" ? AcademicUnit.UAE : AcademicUnit.UACBI);
    const program =
      team.responsableAcademicProgram ?? getProgramForUnit(unit, 1);

    const existingCandidate = team.members.find(
      (member) =>
        member.institutionalEmail.toLowerCase() === team.responsableCorreo.toLowerCase() ||
        member.matricula === team.responsableMatricula
    );

    if (existingCandidate) {
      await db.member.update({
        where: { id: existingCandidate.id },
        data: {
          isLeader: true,
          fullName: team.responsableNombre,
          matricula: team.responsableMatricula,
          institutionalEmail: normalizeInstitutionalEmail(team.responsableCorreo),
          gradoGrupo: team.responsableGradoGrupo,
          academicUnit: unit,
          academicProgram: program,
        },
      });
      updatedLeaders += 1;
      continue;
    }

    const { editionMatriculaKey, editionEmailKey } = getEditionMemberKeys(
      edition.id,
      team.responsableMatricula,
      team.responsableCorreo
    );

    const conflict = await db.member.findFirst({
      where: {
        OR: [{ editionMatriculaKey }, { editionEmailKey }],
      },
      select: { teamId: true },
    });

    if (conflict && conflict.teamId !== team.id) {
      errors.push(`Equipo ${team.animal}: conflicto de correo/matricula del responsable.`);
      continue;
    }

    await db.member.create({
      data: {
        teamId: team.id,
        fullName: team.responsableNombre,
        matricula: team.responsableMatricula,
        institutionalEmail: normalizeInstitutionalEmail(team.responsableCorreo),
        gradoGrupo: team.responsableGradoGrupo,
        academicUnit: unit,
        academicProgram: program,
        isLeader: true,
        editionMatriculaKey,
        editionEmailKey,
      },
    });
    createdLeaders += 1;
  }

  console.log("----- Resumen repair-leaders Semana Cultural -----");
  console.log(`Edicion activa: ${edition.name} (${edition.year})`);
  console.log(`Lideres creados: ${createdLeaders}`);
  console.log(`Lideres actualizados: ${updatedLeaders}`);

  if (errors.length > 0) {
    console.log("Errores detectados:");
    for (const error of errors) {
      console.log(`- ${error}`);
    }
  } else {
    console.log("Sin errores durante la reparacion.");
  }
}

async function cleanupTeams() {
  const teamsToDelete = await db.team.findMany({
    where: getTestTeamWhereInput(),
    select: { id: true, leaderId: true },
  });

  const teamIds = teamsToDelete.map((team) => team.id);
  const leaderIds = teamsToDelete
    .map((team) => team.leaderId)
    .filter((leaderId): leaderId is string => Boolean(leaderId));

  const membersToDeleteCount = teamIds.length
    ? await db.member.count({
        where: { teamId: { in: teamIds } },
      })
    : 0;

  const deletedTeams = teamIds.length
    ? await db.team.deleteMany({
        where: { id: { in: teamIds } },
      })
    : { count: 0 };

  const candidateUsers = await db.user.findMany({
    where: {
      OR: [
        { id: { in: leaderIds } },
        { email: { endsWith: `@${TEST_EMAIL_DOMAIN}` } },
        { name: { startsWith: TEST_NAME_PREFIX } },
      ],
    },
    select: { id: true },
  });

  const candidateUserIds = candidateUsers.map((user) => user.id);
  const orphanUsers = candidateUserIds.length
    ? await db.user.findMany({
        where: {
          id: { in: candidateUserIds },
          assignedTeams: { none: {} },
        },
        select: { id: true },
      })
    : [];

  const orphanUserIds = orphanUsers.map((user) => user.id);
  const deletedUsers = orphanUserIds.length
    ? await db.user.deleteMany({
        where: { id: { in: orphanUserIds } },
      })
    : { count: 0 };

  console.log("----- Resumen cleanup Semana Cultural TEST -----");
  console.log(`Equipos de prueba eliminados: ${deletedTeams.count}`);
  console.log(`Integrantes de prueba eliminados: ${membersToDeleteCount}`);
  console.log(`Usuarios de prueba eliminados: ${deletedUsers.count}`);
}

async function main() {
  const mode = process.argv[2]?.toLowerCase();
  if (
    !mode ||
    (mode !== "seed" && mode !== "members" && mode !== "cleanup" && mode !== "repair-leaders")
  ) {
    usage();
    process.exitCode = 1;
    return;
  }

  assertSafetyGuard();

  if (mode === "seed") {
    await seedTeams();
    return;
  }

  if (mode === "members") {
    await seedMembers();
    return;
  }

  if (mode === "repair-leaders") {
    await repairLeaders();
    return;
  }

  await cleanupTeams();
}

main()
  .catch((error) => {
    console.error("Error en script de prueba Semana Cultural:");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
