import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { exchangeMercadoPagoOAuthCode, saveMercadoPagoAccount, verifyOAuthState } from "@/lib/mercadopago-oauth";
import { getPublicAppUrl } from "@/lib/tickets/config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const appUrl = getPublicAppUrl() || url.origin;

  const verified = state ? verifyOAuthState(state) : null;

  if (!code || !verified) {
    return NextResponse.redirect(`${appUrl}/semana-cultural?mercadopago=invalid_state`);
  }

  const organization = await db.organization.findUnique({ where: { id: verified.organizationId } });
  if (!organization) {
    return NextResponse.redirect(`${appUrl}/semana-cultural?mercadopago=org_not_found`);
  }

  try {
    const tokens = await exchangeMercadoPagoOAuthCode(code);
    await saveMercadoPagoAccount(organization.id, tokens);

    await createAuditLog({
      action: "CONNECT_MERCADOPAGO_ACCOUNT",
      entityType: "Organization",
      entityId: organization.id,
      detail: `Se conectó la cuenta de Mercado Pago (usuario ${tokens.user_id}).`,
    });

    return NextResponse.redirect(
      `${appUrl}/semana-cultural/${organization.slug}/admin/pagos?mercadopago=connected`
    );
  } catch {
    return NextResponse.redirect(
      `${appUrl}/semana-cultural/${organization.slug}/admin/pagos?mercadopago=error`
    );
  }
}
