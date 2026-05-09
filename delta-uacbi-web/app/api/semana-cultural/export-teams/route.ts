import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  getAcademicProgramLabel,
  getAcademicUnitLabel,
  getTeamCompositionFromMembers,
  getTeamCompositionLabel,
  resolveAcademicUnitOrNull,
} from "@/lib/semana-cultural-config";
import { getActiveEdition } from "@/lib/semana-cultural";

function escapeCsv(value: string | number | null | undefined) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const session = await auth();
  const role =
    session?.user &&
    typeof session.user === "object" &&
    "role" in session.user &&
    typeof session.user.role === "string"
      ? session.user.role
      : null;

  if (role !== "ADMIN" && role !== "STAFF") {
    return new Response("No autorizado", { status: 403 });
  }

  const edition = await getActiveEdition();
  if (!edition) {
    return new Response("No hay edicion activa", { status: 404 });
  }

  const teams = await db.team.findMany({
    where: { editionId: edition.id },
    include: {
      members: true,
    },
    orderBy: { animal: "asc" },
  });

  const headers = [
    "Animal/Equipo",
    "Composicion",
    "Responsable",
    "TelefonoResponsable",
    "CorreoResponsable",
    "UnidadResponsable",
    "CarreraResponsable",
    "Estado",
    "Puntos",
    "Participantes",
  ];

  const rows = teams.map((team) => {
    const composition = getTeamCompositionLabel(getTeamCompositionFromMembers(team.members));
    const responsibleUnit = team.responsableAcademicUnit ?? resolveAcademicUnitOrNull(team.unidadAcademica);

    return [
      team.animal,
      composition,
      team.responsableNombre,
      team.responsableTelefono,
      team.responsableCorreo,
      getAcademicUnitLabel(responsibleUnit),
      getAcademicProgramLabel(team.responsableAcademicProgram),
      team.status,
      team.totalPoints,
      team.members.length,
    ]
      .map(escapeCsv)
      .join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="equipos-semana-cultural-${edition.year}.csv"`,
    },
  });
}
