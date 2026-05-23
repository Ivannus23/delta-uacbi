import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getMercadoPagoWebhookSecret,
  getPaymentDisabledMessage,
  isMercadoPagoEnabled,
} from "@/lib/tickets/config";
import { getMercadoPagoPayment, verifyMercadoPagoWebhookSignature } from "@/lib/tickets/mercadopago";
import { normalizeTicketError, processMercadoPagoPayment, TicketDomainError } from "@/lib/tickets/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function extractDataIdFromRequest(url: URL, body: unknown) {
  const fromQuery = toText(url.searchParams.get("data.id") || url.searchParams.get("id"));
  if (fromQuery) {
    return fromQuery;
  }

  if (typeof body === "object" && body !== null && "data" in body && typeof body.data === "object" && body.data !== null) {
    const bodyData = body.data as { id?: string | number };
    if (bodyData.id !== undefined && bodyData.id !== null) {
      return String(bodyData.id).trim();
    }
  }

  return "";
}

async function createWebhookLog(action: string, detail: string, entityId?: string) {
  try {
    await db.ticketAuditLog.create({
      data: {
        action,
        entityType: "MercadoPagoWebhook",
        entityId: entityId || null,
        detail,
      },
    });
  } catch {
    // Avoid breaking webhook responses if logging fails.
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = (await request.json().catch(() => null)) as
    | {
        type?: string;
        action?: string;
        data?: { id?: string | number };
      }
    | null;

  const notificationType = toText(url.searchParams.get("type")) || toText(body?.type);
  const dataId = extractDataIdFromRequest(url, body);

  if (!notificationType || !dataId) {
    await createWebhookLog("MERCADOPAGO_WEBHOOK_INVALID_PAYLOAD", "Webhook sin type o data.id.");
    return NextResponse.json({ ok: false, message: "Payload invalido." }, { status: 400 });
  }

  if (notificationType !== "payment") {
    await createWebhookLog(
      "MERCADOPAGO_WEBHOOK_IGNORED_TOPIC",
      `Webhook ignorado para topic ${notificationType}.`,
      dataId
    );
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (!isMercadoPagoEnabled()) {
    await createWebhookLog(
      "MERCADOPAGO_WEBHOOK_IGNORED_DISABLED",
      "Webhook recibido pero Mercado Pago no esta habilitado.",
      dataId
    );
    return NextResponse.json({ ok: false, message: getPaymentDisabledMessage() }, { status: 503 });
  }

  const webhookSecret = getMercadoPagoWebhookSecret();
  const signature = verifyMercadoPagoWebhookSignature({
    signatureHeader: request.headers.get("x-signature"),
    requestIdHeader: request.headers.get("x-request-id"),
    dataId,
    webhookSecret,
  });

  if (!signature.valid) {
    await createWebhookLog(
      "MERCADOPAGO_WEBHOOK_SIGNATURE_INVALID",
      `Firma invalida: ${signature.reason}`,
      dataId
    );
    return NextResponse.json({ ok: false, message: "Firma de webhook invalida." }, { status: 401 });
  }

  try {
    const payment = await getMercadoPagoPayment(dataId);
    const result = await processMercadoPagoPayment(payment);

    await createWebhookLog(
      "MERCADOPAGO_WEBHOOK_PROCESSED",
      `Webhook procesado. action=${toText(body?.action) || "n/a"} status=${payment.status}.`,
      dataId
    );

    return NextResponse.json({
      ok: true,
      status: result.status,
      orderId: result.orderId,
      publicToken: result.publicToken,
      emittedCount: result.emittedCount,
    });
  } catch (error) {
    const message = normalizeTicketError(error);

    await createWebhookLog("MERCADOPAGO_WEBHOOK_PROCESS_ERROR", message, dataId);
    if (error instanceof TicketDomainError) {
      return NextResponse.json({ ok: false, message }, { status: 200 });
    }
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
