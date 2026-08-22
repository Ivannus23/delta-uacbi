// Catalogo global y fijo de unidades academicas y programas de la UAN.
//
// A diferencia de los nombres de equipo o las categorias de puntuacion (que cada
// organizador configura para su propia edicion), este catalogo es el mismo en toda
// la plataforma: un integrante puede pertenecer a cualquier unidad academica de la
// UAN sin importar quien organiza la semana cultural en la que se registra. Las
// unidades regionales (Norte, Sur Ahuacatlan, Sur Ixtlan del Rio, Bahia de Banderas)
// se listan como entidades independientes -- aunque compartan el nombre de alguna
// carrera con otra unidad, cada una organiza su propia semana cultural por separado.

export type AcademicProgram = {
  code: string;
  label: string;
};

export type AcademicUnit = {
  code: string;
  label: string;
  programs: AcademicProgram[];
};

function program(unitCode: string, label: string): AcademicProgram {
  const slug = label
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return { code: `${unitCode}__${slug}`, label };
}

function unit(code: string, label: string, programLabels: string[]): AcademicUnit {
  return { code, label, programs: programLabels.map((programLabel) => program(code, programLabel)) };
}

export const ACADEMIC_UNITS: AcademicUnit[] = [
  unit("NUEVA_OFERTA", "Nueva oferta académica", [
    "Licenciatura en Biomedicina Ambiental Traslacional",
    "Licenciatura Interinstitucional en Educación Inicial y Gestión de las Instituciones",
  ]),
  unit("UA_NORTE", "Unidad Académica del Norte del Estado de Nayarit", [
    "Licenciatura en Administración",
    "Licenciatura en Ciencias de la Educación",
    "Licenciatura en Contaduría",
    "Licenciatura en Derecho",
  ]),
  unit("UA_SUR_AHUACATLAN", "Unidad Académica del Sur Ahuacatlán", [
    "Licenciatura en Contaduría",
    "Licenciatura en Administración",
  ]),
  unit("UA_SUR_IXTLAN", "Unidad Académica del Sur Ixtlán del Río", [
    "Licenciatura en Ciencias de la Educación",
    "Licenciatura en Derecho",
    "Licenciatura en Psicología",
  ]),
  unit("UA_BAHIA_BANDERAS", "Unidad Académica de Bahía de Banderas", [
    "Licenciatura en Administración",
    "Licenciatura en Contaduría",
    "Licenciatura en Ciencias de la Educación",
    "Licenciatura en Derecho",
    "Licenciatura en Psicología",
  ]),
  unit("UACBI", "Unidad Académica de Ciencias Básicas e Ingenierías", [
    "Ingeniería en Control y Computación",
    "Ingeniería en Electrónica",
    "Ingeniería en Mecánica",
    "Ingeniería Química",
    "Licenciatura en Matemáticas",
  ]),
  unit("UA_CIENCIAS_SOCIALES", "Unidad Académica de Ciencias Sociales", [
    "Licenciatura en Psicología",
    "Licenciatura en Comunicación y Medios",
    "Licenciatura en Ciencia Política",
    "Licenciatura en Estudios Coreanos",
  ]),
  unit("UA_EDUCACION_HUMANIDADES", "Unidad Académica de Educación y Humanidades", [
    "Licenciatura en Ciencias de la Educación Escolarizado",
    "Licenciatura en Ciencias de la Educación Semiescolarizado",
    "Licenciatura en Filosofía",
    "Licenciatura en Lingüística Aplicada",
    "Licenciatura en Educación Infantil",
  ]),
  unit("UA_DERECHO", "Unidad Académica de Derecho", [
    "Licenciatura en Derecho Escolarizado",
    "Licenciatura en Derecho Semiescolarizado",
  ]),
  unit("UA_ECONOMIA", "Unidad Académica de Economía", [
    "Licenciatura en Economía",
    "Licenciatura en Informática",
    "Licenciatura en Sistemas Computacionales",
  ]),
  unit("UA_CONTADURIA_ADMINISTRACION", "Unidad Académica de Contaduría y Administración", [
    "Licenciatura en Contaduría Escolarizado",
    "Licenciatura en Contaduría Semiescolarizado",
    "Licenciatura en Administración Escolarizado",
    "Licenciatura en Administración Semiescolarizado",
    "Licenciatura en Mercadotecnia Escolarizado",
    "Licenciatura en Mercadotecnia Semiescolarizado",
    "Licenciatura en Negocios Internacionales",
    "Licenciatura en Administración Pública",
  ]),
  unit("UA_TURISMO", "Unidad Académica de Turismo", [
    "Licenciatura en Turismo",
    "Licenciatura en Gastronomía",
  ]),
  unit("UA_QUIMICO_BIOLOGICAS", "Unidad Académica de Ciencias Químico, Biológicas y Farmacéuticas", [
    "Licenciatura en Químico Farmacobiólogo",
  ]),
  unit("UA_ODONTOLOGIA", "Unidad Académica de Odontología", ["Licenciatura en Cirujano Dentista"]),
  unit("UAE", "Unidad Académica de Enfermería", ["Licenciatura en Enfermería"]),
  unit("UA_SALUD_INTEGRAL", "Unidad Académica de Salud Integral", [
    "Licenciatura en Nutrición",
    "Licenciatura en Cultura Física y Deporte",
    "Licenciatura en Terapia Física",
  ]),
  unit("UA_MEDICINA", "Unidad Académica de Medicina", ["Licenciatura en Médico Cirujano"]),
  unit("UA_AGRICULTURA", "Unidad Académica de Agricultura", [
    "Ingeniería en Agricultura Escolarizado",
    "Ingeniería en Agricultura Semiescolarizado",
    "Licenciatura en Biología",
  ]),
  unit("UA_VETERINARIA", "Unidad Académica de Medicina Veterinaria y Zootecnia", [
    "Licenciatura en Medicina Veterinaria y Zootecnia",
  ]),
  unit("UA_PESQUERA", "Unidad Académica de Ingeniería Pesquera", [
    "Ingeniería Pesquera",
    "Ingeniería en Acuicultura",
  ]),
  unit("UA_ARTES", "Unidad Académica de Artes", [
    "Licenciatura en Música",
    "Profesional Asociado en Música",
    "Licenciatura en Diseño Urbano y Edificación",
  ]),
];

export function findAcademicUnit(unitCode: string | null | undefined): AcademicUnit | null {
  if (!unitCode) return null;
  return ACADEMIC_UNITS.find((candidate) => candidate.code === unitCode) ?? null;
}

export function findAcademicProgram(programCode: string | null | undefined): AcademicProgram | null {
  if (!programCode) return null;
  for (const academicUnit of ACADEMIC_UNITS) {
    const found = academicUnit.programs.find((candidate) => candidate.code === programCode);
    if (found) return found;
  }
  return null;
}

export function resolveAcademicUnitCode(rawUnitCode: string): string {
  const unitMatch = findAcademicUnit(rawUnitCode);
  if (!unitMatch) {
    throw new Error("Selecciona una unidad academica valida.");
  }
  return unitMatch.code;
}

export function resolveAcademicProgramCode(unitCode: string, rawProgramCode: string): string {
  const unitMatch = findAcademicUnit(unitCode);
  if (!unitMatch) {
    throw new Error("Selecciona una unidad academica valida.");
  }
  const programMatch = unitMatch.programs.find((candidate) => candidate.code === rawProgramCode);
  if (!programMatch) {
    throw new Error("Selecciona una carrera valida para esa unidad academica.");
  }
  return programMatch.code;
}

export function resolveAcademicUnitCodes(rawUnitCodes: string[]): string[] {
  const uniqueCodes = Array.from(new Set(rawUnitCodes.filter(Boolean)));
  if (!uniqueCodes.length) {
    throw new Error("Selecciona al menos una unidad academica organizadora.");
  }
  return uniqueCodes.map((code) => resolveAcademicUnitCode(code));
}

export function formatOrganizingUnitsLabel(unitCodes: string[] | null | undefined): string {
  if (!unitCodes?.length) return "";
  return unitCodes
    .map((code) => findAcademicUnit(code)?.label)
    .filter((label): label is string => Boolean(label))
    .join(" × ");
}
