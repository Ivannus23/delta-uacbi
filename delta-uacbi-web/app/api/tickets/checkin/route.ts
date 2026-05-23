import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSessionUserInfo } from "@/lib/auth";
import { assertStaffCanCheckin, performTicketCheckinByQrToken } from "@/lib/tickets/checkin";
import { normalizeTicketError } from "@/lib/tickets/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const { role, id: scannedById } = getSessionUserInfo(session?.user || null);
    await assertStaffCanCheckin(role);

    const body = (await request.json().catch(() => null)) as { qrToken?: string } | null;
    const qrToken = String(body?.qrToken || "").trim();
    const result = await performTicketCheckinByQrToken(qrToken, scannedById);

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    const message = normalizeTicketError(error);
    const statusCode = message === "No autorizado." ? 403 : 400;
    return NextResponse.json({ ok: false, message }, { status: statusCode });
  }
}
