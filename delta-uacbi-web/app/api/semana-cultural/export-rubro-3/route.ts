import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  getAcademicProgramLabel,
  getAcademicUnitLabel,
  getTeamCompositionFromMembers,
  getTeamCompositionLabel,
  resolveAcademicUnitOrNull,
} from "@/lib/semana-cultural-config";
import { AcademicUnit } from "@prisma/client";
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
      members: {
        orderBy: [{ isLeader: "desc" }, { fullName: "asc" }],
      },
    },
    orderBy: { animal: "asc" },
  });

  const headers = [
    "EquipoAnimal",
    "ComposicionEquipo",
    "TotalParticipantesEquipo",
    "TotalUAE",
    "TotalUACBI",
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
    const composition = getTeamCompositionLabel(getTeamCompositionFromMembers(team.members));
    const totalUAE = team.members.filter((member) => member.academicUnit === AcademicUnit.UAE).length;
    const totalUACBI = team.members.filter((member) => member.academicUnit === AcademicUnit.UACBI).length;
    const leader = team.members.find((member) => member.isLeader) ?? null;
    const leaderUnit =
      leader?.academicUnit ??
      team.responsableAcademicUnit ??
      resolveAcademicUnitOrNull(team.unidadAcademica);
    const leaderProgram = leader?.academicProgram ?? team.responsableAcademicProgram ?? null;

    const countsByProgram = new Map<string, number>();
    for (const member of team.members) {
      const label = getAcademicProgramLabel(member.academicProgram);
      countsByProgram.set(label, (countsByProgram.get(label) ?? 0) + 1);
    }

    if (!countsByProgram.size) {
      rows.push(
        [
          team.animal,
          composition,
          team.members.length,
          totalUAE,
          totalUACBI,
          "Sin carrera registrada",
          0,
          leader?.fullName ?? team.responsableNombre,
          getAcademicUnitLabel(leaderUnit),
          getAcademicProgramLabel(leaderProgram),
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
          totalUAE,
          totalUACBI,
          program,
          totalByProgram,
          leader?.fullName ?? team.responsableNombre,
          getAcademicUnitLabel(leaderUnit),
          getAcademicProgramLabel(leaderProgram),
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
      "Content-Disposition": `attachment; filename="rubro-3-semana-cultural-${edition.year}.csv"`,
    },
  });
}
