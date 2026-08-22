import { createHmac, timingSafeEqual } from "node:crypto";
import { getMercadoPagoAccessToken } from "@/lib/tickets/config";

const MERCADO_PAGO_API_BASE = "https://api.mercadopago.com";

export class MercadoPagoError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "MercadoPagoError";
    this.statusCode = statusCode;
  }
}

type MercadoPagoPreferenceItem = {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
};

type MercadoPagoCreatePreferenceInput = {
  externalReference: string;
  payer: {
    name: string;
    email: string;
    phone: string;
  };
  items: MercadoPagoPreferenceItem[];
  notificationUrl: string;
  successUrl: string;
  pendingUrl: string;
  failureUrl: string;
  accessToken?: string;
};

export type MercadoPagoPreferenceResult = {
  id: string;
  initPoint: string;
  sandboxInitPoint: string | null;
};

export type MercadoPagoPayment = {
  id: number;
  status: string;
  status_detail?: string;
  external_reference?: string;
  date_created?: string;
  date_approved?: string;
  date_last_updated?: string;
  transaction_amount?: number;
};

type MercadoPagoApiErrorBody = {
  message?: string;
  cause?: Array<{ description?: string }>;
};

async function mercadoPagoRequest<T>(
  path: string,
  init?: RequestInit,
  accessTokenOverride?: string
): Promise<T> {
  const accessToken = accessTokenOverride || getMercadoPagoAccessToken();
  if (!accessToken) {
    throw new MercadoPagoError("Mercado Pago no esta configurado.", 503);
  }

  const response = await fetch(`${MERCADO_PAGO_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Mercado Pago respondio con estado ${response.status}.`;

    try {
      const body = (await response.json()) as MercadoPagoApiErrorBody;
      const causeMessage = body.cause?.find((item) => Boolean(item.description))?.description;
      message = causeMessage || body.message || message;
    } catch {
      // no-op
    }

    throw new MercadoPagoError(message, response.status);
  }

  return (await response.json()) as T;
}

export async function createMercadoPagoPreference(
  input: MercadoPagoCreatePreferenceInput
): Promise<MercadoPagoPreferenceResult> {
  type ResponseShape = {
    id: string;
    init_point: string;
    sandbox_init_point?: string | null;
  };

  const payload = {
    external_reference: input.externalReference,
    notification_url: input.notificationUrl,
    back_urls: {
      success: input.successUrl,
      pending: input.pendingUrl,
      failure: input.failureUrl,
    },
    auto_return: "approved",
    payer: {
      name: input.payer.name,
      email: input.payer.email,
      phone: {
        number: input.payer.phone,
      },
    },
    items: input.items,
    metadata: {
      order_public_token: input.externalReference,
    },
  };

  const response = await mercadoPagoRequest<ResponseShape>(
    "/checkout/preferences",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    input.accessToken
  );

  if (!response.id || !response.init_point) {
    throw new MercadoPagoError("No se pudo iniciar el checkout con Mercado Pago.", 502);
  }

  return {
    id: response.id,
    initPoint: response.init_point,
    sandboxInitPoint: response.sandbox_init_point ?? null,
  };
}

export async function getMercadoPagoPayment(paymentId: string | number, options?: { accessToken?: string }) {
  const normalizedId = String(paymentId || "").trim();
  if (!normalizedId) {
    throw new MercadoPagoError("El identificador de pago es invalido.", 400);
  }

  return mercadoPagoRequest<MercadoPagoPayment>(
    `/v1/payments/${encodeURIComponent(normalizedId)}`,
    { method: "GET" },
    options?.accessToken
  );
}

function parseSignatureHeader(signatureHeader: string | null) {
  if (!signatureHeader) {
    return { ts: null, v1: null };
  }

  const parts = signatureHeader.split(",");
  let ts: string | null = null;
  let v1: string | null = null;

  for (const part of parts) {
    const [key, value] = part.split("=", 2).map((item) => item.trim());
    if (!key || !value) {
      continue;
    }
    if (key === "ts") {
      ts = value;
      continue;
    }
    if (key === "v1") {
      v1 = value;
    }
  }

  return { ts, v1 };
}

export function verifyMercadoPagoWebhookSignature(args: {
  signatureHeader: string | null;
  requestIdHeader: string | null;
  dataId: string;
  webhookSecret: string;
  toleranceMs?: number;
}) {
  const { signatureHeader, requestIdHeader, dataId, webhookSecret } = args;
  const toleranceMs = args.toleranceMs ?? 5 * 60 * 1000;
  const { ts, v1 } = parseSignatureHeader(signatureHeader);

  if (!webhookSecret.trim()) {
    return { valid: false, reason: "MERCADOPAGO_WEBHOOK_SECRET no configurado." };
  }
  if (!ts || !v1) {
    return { valid: false, reason: "Firma de webhook incompleta." };
  }
  if (!requestIdHeader) {
    return { valid: false, reason: "Encabezado x-request-id ausente." };
  }

  const timestamp = Number(ts);
  if (Number.isFinite(timestamp)) {
    const drift = Math.abs(Date.now() - timestamp);
    if (drift > toleranceMs) {
      return { valid: false, reason: "Timestamp de webhook fuera de tolerancia." };
    }
  }

  const manifest = `id:${dataId};request-id:${requestIdHeader};ts:${ts};`;
  const expected = createHmac("sha256", webhookSecret).update(manifest).digest("hex");

  const providedBuffer = Buffer.from(v1, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (providedBuffer.length !== expectedBuffer.length) {
    return { valid: false, reason: "Longitud de firma invalida." };
  }

  const isValid = timingSafeEqual(providedBuffer, expectedBuffer);
  return isValid ? { valid: true as const } : { valid: false, reason: "Firma de webhook no valida." };
}
