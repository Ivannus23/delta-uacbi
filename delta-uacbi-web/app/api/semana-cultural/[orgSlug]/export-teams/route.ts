import { auth } from "@/auth";
import { db } from "@/lib/db";
import { escapeCsv } from "@/lib/csv";
import { getOrgRole, getSessionUserInfo, isStaffRole } from "@/lib/auth";
import { formatProgramLabel, formatUnitLabel, getTeamComposition } from "@/lib/semana-cultural-config";
import { getActiveEdition } from "@/lib/semana-cultural";

export async function GET(
  _request: Request,
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

  const teams = await db.team.findMany({
    where: { editionId: edition.id },
    include: {
      members: {
        select: {
          academicUnitCode: true,
        },
      },
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
    const composition = getTeamComposition(team.members.map((member) => member.academicUnitCode));

    return [
      team.animal,
      composition,
      team.responsableNombre,
      team.responsableTelefono,
      team.responsableCorreo,
      formatUnitLabel(team.responsableAcademicUnitCode),
      formatProgramLabel(team.responsableAcademicProgramCode),
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
      "Content-Disposition": `attachment; filename="equipos-${orgSlug}-${edition.year}.csv"`,
    },
  });
}
