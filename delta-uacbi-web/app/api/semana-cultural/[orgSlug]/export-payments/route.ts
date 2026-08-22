import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getOrgRole, getSessionUserInfo, isStaffRole } from "@/lib/auth";
import { getActiveEdition } from "@/lib/semana-cultural";
import { buildTeamPaymentsCsv } from "@/lib/semana-cultural-payments";

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

  const csv = await buildTeamPaymentsCsv(edition.id);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pagos-${orgSlug}-${edition.year}.csv"`,
    },
  });
}
