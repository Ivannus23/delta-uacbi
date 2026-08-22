import { NextResponse } from "next/server";
import { requireOrgAdmin } from "@/lib/auth";
import { resolveOrganization } from "@/lib/semana-cultural";
import {
  getMercadoPagoAuthorizeUrl,
  isMercadoPagoMarketplaceConfigured,
  signOAuthState,
} from "@/lib/mercadopago-oauth";

export async function GET(_request: Request, { params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const organization = await resolveOrganization(orgSlug);
  await requireOrgAdmin(organization.id);

  if (!isMercadoPagoMarketplaceConfigured()) {
    return NextResponse.json(
      { ok: false, message: "La integración con Mercado Pago todavía no está configurada." },
      { status: 503 }
    );
  }

  const state = signOAuthState(organization.id);
  const authorizeUrl = getMercadoPagoAuthorizeUrl(state);

  return NextResponse.redirect(authorizeUrl);
}
