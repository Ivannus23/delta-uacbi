import { NextResponse } from "next/server";
import { createMercadoPagoCheckoutByPublicToken, normalizeTicketError, TicketDomainError } from "@/lib/tickets/orders";
import { getPaymentDisabledMessage, isMercadoPagoEnabled } from "@/lib/tickets/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildOrderUrl(publicToken: string, errorMessage?: string) {
  const basePath = `/tickets/orden/${encodeURIComponent(publicToken)}`;
  if (!errorMessage) {
    return basePath;
  }
  return `${basePath}?paymentError=${encodeURIComponent(errorMessage)}`;
}

async function getPublicTokenFromRequest(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as { publicToken?: string } | null;
    return String(body?.publicToken || "").trim();
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    return String(formData.get("publicToken") || "").trim();
  }

  const { searchParams } = new URL(request.url);
  return String(searchParams.get("publicToken") || "").trim();
}

function expectsJson(request: Request) {
  const accept = request.headers.get("accept") || "";
  const contentType = request.headers.get("content-type") || "";
  return accept.includes("application/json") || contentType.includes("application/json");
}

export async function POST(request: Request) {
  const wantsJson = expectsJson(request);
  const publicToken = await getPublicTokenFromRequest(request);

  if (!publicToken) {
    const message = "Orden no encontrada.";
    if (wantsJson) {
      return NextResponse.json({ ok: false, message }, { status: 400 });
    }
    return NextResponse.redirect(new URL(`/tickets/eventos?paymentError=${encodeURIComponent(message)}`, request.url), 303);
  }

  if (!isMercadoPagoEnabled()) {
    const message = getPaymentDisabledMessage();
    if (wantsJson) {
      return NextResponse.json({ ok: false, message }, { status: 503 });
    }
    return NextResponse.redirect(new URL(buildOrderUrl(publicToken, message), request.url), 303);
  }

  try {
    const checkout = await createMercadoPagoCheckoutByPublicToken(publicToken);

    if (wantsJson) {
      return NextResponse.json({
        ok: true,
        checkoutUrl: checkout.checkoutUrl,
        preferenceId: checkout.preferenceId,
      });
    }

    return NextResponse.redirect(checkout.checkoutUrl, 303);
  } catch (error) {
    const message = normalizeTicketError(error);
    const statusCode = error instanceof TicketDomainError ? 400 : 500;

    if (wantsJson) {
      return NextResponse.json({ ok: false, message }, { status: statusCode });
    }

    return NextResponse.redirect(new URL(buildOrderUrl(publicToken, message), request.url), 303);
  }
}
