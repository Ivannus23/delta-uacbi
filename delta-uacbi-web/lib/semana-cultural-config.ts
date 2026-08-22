import { findAcademicUnit, findAcademicProgram } from "@/lib/academic-catalog";

export const MAX_TEAM_MEMBERS = 60;

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

export function formatUnitLabel(unitCode: string | null | undefined): string {
  return findAcademicUnit(unitCode)?.label ?? "Sin unidad registrada";
}

export function formatProgramLabel(programCode: string | null | undefined): string {
  return findAcademicProgram(programCode)?.label ?? "Sin carrera registrada";
}

export function getTeamComposition(unitCodes: Array<string | null | undefined>): string {
  const labels = new Set(
    unitCodes
      .map((unitCode) => findAcademicUnit(unitCode)?.label)
      .filter((label): label is string => Boolean(label))
  );

  if (!labels.size) {
    return "Sin datos";
  }
  if (labels.size === 1) {
    return Array.from(labels)[0];
  }
  return `Mixto: ${Array.from(labels).sort().join(" × ")}`;
}
