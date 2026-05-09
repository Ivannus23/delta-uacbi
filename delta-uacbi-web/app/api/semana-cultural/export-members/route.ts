import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  getAcademicProgramLabel,
  getAcademicUnitLabel,
  getTeamCompositionFromMembers,
  getTeamCompositionLabel,
} from "@/lib/semana-cultural-config";
import { getActiveEdition } from "@/lib/semana-cultural";

function escapeCsv(value: string | number | null | undefined) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId")?.trim();

  if (!teamId) {
    return new Response("Falta teamId", { status: 400 });
  }

  const team = await db.team.findFirst({
    where: {
      id: teamId,
      editionId: edition.id,
    },
    include: {
      members: {
        orderBy: [{ isLeader: "desc" }, { fullName: "asc" }],
      },
    },
  });

  if (!team) {
    return new Response("Equipo no encontrado", { status: 404 });
  }

  const composition = getTeamCompositionLabel(getTeamCompositionFromMembers(team.members));

  const headers = [
    "Animal/Equipo",
    "ComposicionEquipo",
    "NombreParticipante",
    "Matricula",
    "CorreoInstitucional",
    "GradoGrupo",
    "UnidadAcademicaParticipante",
    "CarreraParticipante",
    "Rol",
    "Responsable",
    "TelefonoResponsable",
  ];

  const rows = team.members.map((member) =>
    [
      team.animal,
      composition,
      member.fullName,
      member.matricula,
      member.institutionalEmail,
      member.gradoGrupo,
      getAcademicUnitLabel(member.academicUnit),
      getAcademicProgramLabel(member.academicProgram),
      member.isLeader ? "Encargado" : "Integrante",
      team.responsableNombre,
      team.responsableTelefono,
    ]
      .map(escapeCsv)
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const safeTeamName = team.animal.toLowerCase().replace(/\s+/g, "-");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="integrantes-${safeTeamName}-${edition.year}.csv"`,
    },
  });
}
