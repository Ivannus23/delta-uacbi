import { auth } from "@/auth";
import { getSessionUserInfo, isStaffRole } from "@/lib/auth";
import { buildEventAttendeesCsv } from "@/lib/tickets/export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExportEventRouteProps = {
  params: Promise<{ eventId: string }>;
};

export async function GET(_request: Request, { params }: ExportEventRouteProps) {
  const session = await auth();
  const { role } = getSessionUserInfo(session?.user || null);
  if (!isStaffRole(role)) {
    return new Response("No autorizado", { status: 403 });
  }

  const { eventId } = await params;
  const payload = await buildEventAttendeesCsv(eventId);
  if (!payload) {
    return new Response("Evento no encontrado", { status: 404 });
  }

  const safeSlug = payload.event.slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  return new Response(payload.csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tickets-asistentes-${safeSlug || payload.event.id}.csv"`,
    },
  });
}
