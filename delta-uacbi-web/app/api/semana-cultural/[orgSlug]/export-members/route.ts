import { auth } from "@/auth";
import { db } from "@/lib/db";
import { escapeCsv } from "@/lib/csv";
import { getOrgRole, getSessionUserInfo, isStaffRole } from "@/lib/auth";
import { formatProgramLabel, formatUnitLabel, getTeamComposition } from "@/lib/semana-cultural-config";
import { getActiveEdition } from "@/lib/semana-cultural";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  const { orgSlug } = await params;
  const organization = await db.organization.findUnique({ where: { slug: orgSlug } });
  if (!organization) {
    return new Response("Organizacion no encontrada", { status: 404 });
  }

  const session = await auth();
  const { role: platformRole, id: userId } = getSessionUserInfo(session?.user);
  const orgRole = await getOrgRole(organization.id, userId, platformRole);

  if (!isStaffRole(orgRole)) {
    return new Response("No autorizado", { status: 403 });
  }

  const edition = await getActiveEdition(organization.id);
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

  const composition = getTeamComposition(team.members.map((member) => member.academicUnitCode));

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
      formatUnitLabel(member.academicUnitCode),
      formatProgramLabel(member.academicProgramCode),
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
