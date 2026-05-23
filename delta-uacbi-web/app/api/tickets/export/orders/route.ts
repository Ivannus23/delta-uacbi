import { auth } from "@/auth";
import { getSessionUserInfo, isStaffRole } from "@/lib/auth";
import { buildOrdersCsv } from "@/lib/tickets/export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const { role } = getSessionUserInfo(session?.user || null);
  if (!isStaffRole(role)) {
    return new Response("No autorizado", { status: 403 });
  }

  const csv = await buildOrdersCsv();
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tickets-orders.csv"',
    },
  });
}
