import { db } from "@/lib/db";
import { getActiveEdition } from "@/lib/semana-cultural";

function escapeCsv(value: string | number | null | undefined) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const edition = await getActiveEdition();

  if (!edition) {
    return new Response("No hay edición activa", { status: 404 });
  }

  const teams = await db.team.findMany({
    where: { editionId: edition.id },
    include: {
      members: true,
    },
    orderBy: { name: "asc" },
  });

  const headers = [
    "Equipo",
    "UnidadAcademica",
    "Animal",
    "Color",
    "Responsable",
    "CorreoResponsable",
    "TelefonoResponsable",
    "Estado",
    "Puntos",
    "Integrantes",
  ];

  const rows = teams.map((team) =>
    [
      team.name,
      team.unidadAcademica,
      team.animal,
      team.color,
      team.responsableNombre,
      team.responsableCorreo,
      team.responsableTelefono ?? "",
      team.status,
      team.totalPoints,
      team.members.length,
    ]
      .map(escapeCsv)
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="equipos-semana-cultural-${edition.year}.csv"`,
    },
  });
}
