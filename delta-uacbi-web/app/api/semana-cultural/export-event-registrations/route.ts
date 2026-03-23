import { db } from "@/lib/db";
import { getActiveEdition } from "@/lib/semana-cultural";

function escapeCsv(value: string | number | null | undefined) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  const edition = await getActiveEdition();
  if (!edition) {
    return new Response("No hay edición activa", { status: 404 });
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
          team: true,
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
    "Equipo",
    "UnidadAcademica",
    "Integrante",
    "Matricula",
    "CorreoInstitucional",
    "CheckIn",
    "Notas",
  ];

  const rows = event.registrations.map((registration) =>
    [
      event.name,
      registration.team.name,
      registration.team.unidadAcademica,
      registration.member?.fullName ?? "",
      registration.member?.matricula ?? "",
      registration.member?.institutionalEmail ?? "",
      registration.checkedIn ? "SI" : "NO",
      registration.notes ?? "",
    ]
      .map(escapeCsv)
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="actividad-${event.slug}-inscritos.csv"`,
    },
  });
}
