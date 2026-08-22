import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { verifyMercadoPagoWebhookSignature } from "@/lib/tickets/mercadopago";
import { processMercadoPagoTeamPayment } from "@/lib/semana-cultural-payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function extractDataIdFromRequest(url: URL, body: unknown) {
  const fromQuery = toText(url.searchParams.get("data.id") || url.searchParams.get("id"));
  if (fromQuery) return fromQuery;

  if (typeof body === "object" && body !== null && "data" in body && typeof body.data === "object" && body.data !== null) {
    const bodyData = body.data as { id?: string | number };
    if (bodyData.id !== undefined && bodyData.id !== null) {
      return String(bodyData.id).trim();
    }
  }

  return "";
}

async function logWebhookEvent(action: string, detail: string, entityId?: string) {
  try {
    await createAuditLog({
      action,
      entityType: "MercadoPagoTeamWebhook",
      entityId: entityId || undefined,
      detail,
    });
  } catch {
    // Avoid breaking webhook responses if logging fails.
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = (await request.json().catch(() => null)) as
    | { type?: string; action?: string; data?: { id?: string | number } }
    | null;

  const notificationType = toText(url.searchParams.get("type")) || toText(body?.type);
  const dataId = extractDataIdFromRequest(url, body);
  const paymentToken = toText(url.searchParams.get("paymentToken"));

  if (!notificationType || !dataId || !paymentToken) {
    await logWebhookEvent("MERCADOPAGO_TEAM_WEBHOOK_INVALID_PAYLOAD", "Webhook sin type, data.id o paymentToken.");
    return NextResponse.json({ ok: false, message: "Payload invalido." }, { status: 400 });
  }

  if (notificationType !== "payment") {
    await logWebhookEvent(
      "MERCADOPAGO_TEAM_WEBHOOK_IGNORED_TOPIC",
      `Webhook ignorado para topic ${notificationType}.`,
      paymentToken
    );
    return NextResponse.json({ ok: true, ignored: true });
  }

  const webhookSecret = (process.env.MERCADOPAGO_MARKETPLACE_WEBHOOK_SECRET || "").trim();
  const signature = verifyMercadoPagoWebhookSignature({
    signatureHeader: request.headers.get("x-signature"),
    requestIdHeader: request.headers.get("x-request-id"),
    dataId,
    webhookSecret,
  });

  if (!signature.valid) {
    await logWebhookEvent(
      "MERCADOPAGO_TEAM_WEBHOOK_SIGNATURE_INVALID",
      `Firma invalida: ${signature.reason}`,
      paymentToken
    );
    return NextResponse.json({ ok: false, message: "Firma de webhook invalida." }, { status: 401 });
  }

  try {
    const result = await processMercadoPagoTeamPayment(paymentToken, dataId);

    await logWebhookEvent(
      "MERCADOPAGO_TEAM_WEBHOOK_PROCESSED",
      `Webhook procesado. action=${toText(body?.action) || "n/a"}.`,
      paymentToken
    );

    return NextResponse.json({ ok: true, status: result.status, paymentId: result.paymentId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo procesar el webhook.";
    await logWebhookEvent("MERCADOPAGO_TEAM_WEBHOOK_PROCESS_ERROR", message, paymentToken);
    return NextResponse.json({ ok: false, message }, { status: 200 });
  }
}
