import { AcademicProgram, AcademicUnit } from "@prisma/client";

export const SEMANA_CULTURAL_UNIDADES = ["UAE", "UACBI"] as const;
export type UnidadAcademica = (typeof SEMANA_CULTURAL_UNIDADES)[number];

export const SEMANA_CULTURAL_ANIMALES = [
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
] as const;

export const UACBI_ACADEMIC_PROGRAMS = [
  AcademicProgram.INGENIERIA_MECANICA,
  AcademicProgram.INGENIERIA_CONTROL_COMPUTACION,
  AcademicProgram.LICENCIATURA_MATEMATICAS,
  AcademicProgram.INGENIERIA_QUIMICA,
  AcademicProgram.INGENIERIA_ELECTRONICA,
] as const;

export const UAE_ACADEMIC_PROGRAM = AcademicProgram.LICENCIATURA_ENFERMERIA;

const UACBI_PROGRAM_SET = new Set<string>(UACBI_ACADEMIC_PROGRAMS);

const ACADEMIC_PROGRAM_LABELS: Record<AcademicProgram, string> = {
  [AcademicProgram.INGENIERIA_MECANICA]: "Ingenieria Mecanica",
  [AcademicProgram.INGENIERIA_CONTROL_COMPUTACION]: "Ingenieria en Control y Computacion",
  [AcademicProgram.LICENCIATURA_MATEMATICAS]: "Licenciatura en Matematicas",
  [AcademicProgram.INGENIERIA_QUIMICA]: "Ingenieria Quimica",
  [AcademicProgram.INGENIERIA_ELECTRONICA]: "Ingenieria Electronica",
  [AcademicProgram.LICENCIATURA_ENFERMERIA]: "Licenciatura en Enfermeria",
};

export function normalizeUnidadAcademica(value: string): UnidadAcademica | null {
  const normalized = value.trim().toUpperCase();
  return SEMANA_CULTURAL_UNIDADES.includes(normalized as UnidadAcademica)
    ? (normalized as UnidadAcademica)
    : null;
}

export function resolveAcademicUnit(rawAcademicUnit: string): AcademicUnit {
  const normalized = normalizeUnidadAcademica(rawAcademicUnit);
  if (!normalized) {
    throw new Error("Selecciona una unidad academica valida.");
  }
  return normalized === "UAE" ? AcademicUnit.UAE : AcademicUnit.UACBI;
}

export function resolveAcademicUnitOrNull(rawAcademicUnit: string | null | undefined) {
  if (!rawAcademicUnit) {
    return null;
  }
  const normalized = normalizeUnidadAcademica(rawAcademicUnit);
  if (!normalized) {
    return null;
  }
  return normalized === "UAE" ? AcademicUnit.UAE : AcademicUnit.UACBI;
}

export function getAcademicUnitLabel(unit: AcademicUnit | null | undefined): string {
  if (!unit) {
    return "Sin unidad registrada";
  }
  return unit === AcademicUnit.UAE ? "UAE" : "UACBI";
}

export function getAcademicProgramLabel(program: AcademicProgram | null | undefined): string {
  if (!program) {
    return "Sin carrera registrada";
  }
  return ACADEMIC_PROGRAM_LABELS[program];
}

export function getAcademicProgramOptionsForUnit(unit: AcademicUnit): AcademicProgram[] {
  if (unit === AcademicUnit.UAE) {
    return [UAE_ACADEMIC_PROGRAM];
  }
  return [...UACBI_ACADEMIC_PROGRAMS];
}

export function resolveAcademicProgramForUnit(params: {
  academicUnit: AcademicUnit;
  rawProgram: string;
}): AcademicProgram {
  if (params.academicUnit === AcademicUnit.UAE) {
    return UAE_ACADEMIC_PROGRAM;
  }

  const trimmedProgram = params.rawProgram.trim();
  const selectedProgram = Object.values(AcademicProgram).find(
    (program) => program === trimmedProgram
  );

  if (!selectedProgram) {
    throw new Error("Selecciona una carrera valida.");
  }

  if (!UACBI_PROGRAM_SET.has(selectedProgram)) {
    throw new Error("La carrera seleccionada no corresponde a UACBI.");
  }

  return selectedProgram;
}

export function sanitizeMatricula(value: string) {
  return value.trim().toUpperCase();
}

export function normalizeInstitutionalEmail(value: string) {
  return value.trim().toLowerCase();
}

export function getEditionMemberKeys(
  editionId: string,
  matricula: string,
  institutionalEmail: string
) {
  return {
    editionMatriculaKey: `${editionId}:${sanitizeMatricula(matricula).toLowerCase()}`,
    editionEmailKey: `${editionId}:${normalizeInstitutionalEmail(institutionalEmail)}`,
  };
}

export function getTeamCompositionFromUnits(
  units: Array<AcademicUnit | null | undefined>
): "UAE" | "UACBI" | "MIXTO" | "SIN_DATOS" {
  const normalized = new Set<AcademicUnit>();

  for (const unit of units) {
    if (unit) {
      normalized.add(unit);
    }
  }

  if (!normalized.size) {
    return "SIN_DATOS";
  }
  if (normalized.size === 1) {
    return normalized.has(AcademicUnit.UAE) ? "UAE" : "UACBI";
  }
  return "MIXTO";
}

export function getTeamCompositionLabel(
  composition: "UAE" | "UACBI" | "MIXTO" | "SIN_DATOS" | string
): string {
  if (composition === "MIXTO") {
    return "Mixto UAE x UACBI";
  }
  if (composition === "SIN_DATOS") {
    return "Sin datos";
  }
  return composition;
}

export function getTeamCompositionFromMembers(members: Array<{ academicUnit?: AcademicUnit | null }>) {
  return getTeamCompositionFromUnits(members.map((member) => member.academicUnit ?? null));
}
