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

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  const edition = await getActiveEdition(organization.id);
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
      scoreCategory: true,
      registrations: {
        include: {
          team: {
            include: {
              members: {
                select: {
                  academicUnitCode: true,
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
    "Suma puntos",
    "Categoría de puntos",
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
    const composition = getTeamComposition(
      registration.team.members.map((member) => member.academicUnitCode)
    );

    return [
      event.name,
      event.isScored ? "Sí" : "No",
      event.isScored ? event.scoreCategory?.label ?? "Sin categoría" : "No aplica",
      registration.team.animal,
      composition,
      registration.team.responsableNombre,
      registration.team.responsableTelefono,
      registration.team.responsableCorreo,
      formatUnitLabel(registration.team.responsableAcademicUnitCode),
      formatProgramLabel(registration.team.responsableAcademicProgramCode),
      registration.member?.fullName ?? "",
      registration.member?.matricula ?? "",
      registration.member?.institutionalEmail ?? "",
      formatUnitLabel(registration.member?.academicUnitCode),
      formatProgramLabel(registration.member?.academicProgramCode),
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
