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
        orderBy: [{ isLeader: "desc" }, { fullName: "asc" }],
      },
    },
    orderBy: { animal: "asc" },
  });

  const unitCodesPresent = Array.from(
    new Set(teams.flatMap((team) => team.members.map((member) => member.academicUnitCode)))
  ).sort();

  const headers = [
    "EquipoAnimal",
    "ComposicionEquipo",
    "TotalParticipantesEquipo",
    ...unitCodesPresent.map((unitCode) => `Total${formatUnitLabel(unitCode)}`),
    "Carrera",
    "TotalPorCarrera",
    "Encargado",
    "UnidadEncargado",
    "CarreraEncargado",
    "TelefonoResponsable",
    "CorreoResponsable",
  ];

  const rows: string[] = [];

  for (const team of teams) {
    const composition = getTeamComposition(team.members.map((member) => member.academicUnitCode));
    const unitCounts = unitCodesPresent.map(
      (unitCode) => team.members.filter((member) => member.academicUnitCode === unitCode).length
    );
    const leader = team.members.find((member) => member.isLeader) ?? null;
    const leaderUnit = leader?.academicUnitCode ?? team.responsableAcademicUnitCode ?? null;
    const leaderProgram = leader?.academicProgramCode ?? team.responsableAcademicProgramCode ?? null;

    const countsByProgram = new Map<string, number>();
    for (const member of team.members) {
      const label = formatProgramLabel(member.academicProgramCode);
      countsByProgram.set(label, (countsByProgram.get(label) ?? 0) + 1);
    }

    if (!countsByProgram.size) {
      rows.push(
        [
          team.animal,
          composition,
          team.members.length,
          ...unitCounts,
          "Sin carrera registrada",
          0,
          leader?.fullName ?? team.responsableNombre,
          formatUnitLabel(leaderUnit),
          formatProgramLabel(leaderProgram),
          team.responsableTelefono,
          team.responsableCorreo,
        ]
          .map(escapeCsv)
          .join(",")
      );
      continue;
    }

    for (const [program, totalByProgram] of countsByProgram.entries()) {
      rows.push(
        [
          team.animal,
          composition,
          team.members.length,
          ...unitCounts,
          program,
          totalByProgram,
          leader?.fullName ?? team.responsableNombre,
          formatUnitLabel(leaderUnit),
          formatProgramLabel(leaderProgram),
          team.responsableTelefono,
          team.responsableCorreo,
        ]
          .map(escapeCsv)
          .join(",")
      );
    }
  }

  const csv = [headers.join(","), ...rows].join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rubro-3-${orgSlug}-${edition.year}.csv"`,
    },
  });
}
