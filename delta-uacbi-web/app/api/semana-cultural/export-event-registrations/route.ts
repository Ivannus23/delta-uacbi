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

export async function GET(req: Request) {
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

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  const edition = await getActiveEdition();
  if (!edition) {
    return new Response("No hay edicion activa", { status: 404 });
  }

  if (!eventId) {
    return new Response("Falta eventId", { status: 400 });
  }

  const event = await db.event.findFirst({
    where: {
      id: eventId,
      editionId: edition.id,
    },
    include: {
      registrations: {
        include: {
          team: {
            include: {
              members: {
                select: {
                  academicUnit: true,
                },
              },
            },
          },
          member: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!event) {
    return new Response("Actividad no encontrada", { status: 404 });
  }

  const headers = [
    "Actividad",
    "Animal/Equipo",
    "ComposicionEquipo",
    "Responsable",
    "TelefonoResponsable",
    "CorreoResponsable",
    "UnidadResponsable",
    "CarreraResponsable",
    "Participante",
    "Matricula",
    "CorreoInstitucional",
    "UnidadParticipante",
    "CarreraParticipante",
    "RolParticipante",
    "CheckIn",
    "Notas",
  ];

  const rows = event.registrations.map((registration) => {
    const composition = getTeamCompositionLabel(
      getTeamCompositionFromMembers(registration.team.members)
    );
    const responsibleUnit =
      registration.team.responsableAcademicUnit ??
      resolveAcademicUnitOrNull(registration.team.unidadAcademica);

    return [
      event.name,
      registration.team.animal,
      composition,
      registration.team.responsableNombre,
      registration.team.responsableTelefono,
      registration.team.responsableCorreo,
      getAcademicUnitLabel(responsibleUnit),
      getAcademicProgramLabel(registration.team.responsableAcademicProgram),
      registration.member?.fullName ?? "",
      registration.member?.matricula ?? "",
      registration.member?.institutionalEmail ?? "",
      getAcademicUnitLabel(registration.member?.academicUnit),
      getAcademicProgramLabel(registration.member?.academicProgram),
      registration.member ? (registration.member.isLeader ? "Encargado" : "Integrante") : "",
      registration.checkedIn ? "SI" : "NO",
      registration.notes ?? "",
    ]
      .map(escapeCsv)
      .join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="actividad-${event.slug}-inscritos.csv"`,
    },
  });
}
