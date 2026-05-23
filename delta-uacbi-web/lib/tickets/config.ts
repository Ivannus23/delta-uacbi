export type TicketPaymentMode = "SIMULATED" | "MERCADOPAGO" | "DISABLED";

function normalize(value: string | undefined) {
  return (value || "").trim();
}

function normalizeUpper(value: string | undefined) {
  return normalize(value).toUpperCase();
}

function getConfiguredMode() {
  return normalizeUpper(process.env.TICKETS_PAYMENT_MODE);
}

function getMercadoPagoAccessTokenInternal() {
  return normalize(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

function getMercadoPagoWebhookSecretInternal() {
  return normalize(process.env.MERCADOPAGO_WEBHOOK_SECRET);
}

function getPublicAppUrlInternal() {
  return normalize(process.env.NEXT_PUBLIC_APP_URL).replace(/\/+$/, "");
}

export function getMercadoPagoMissingConfigKeys() {
  const missing: string[] = [];

  if (!getMercadoPagoAccessTokenInternal()) {
    missing.push("MERCADOPAGO_ACCESS_TOKEN");
  }
  if (!getMercadoPagoWebhookSecretInternal()) {
    missing.push("MERCADOPAGO_WEBHOOK_SECRET");
  }
  if (!getPublicAppUrlInternal()) {
    missing.push("NEXT_PUBLIC_APP_URL");
  }

  return missing;
}

export function hasMercadoPagoConfig() {
  return getMercadoPagoMissingConfigKeys().length === 0;
}

export function getTicketPaymentMode(): TicketPaymentMode {
  const configuredMode = getConfiguredMode();

  if (!configuredMode) {
    return process.env.NODE_ENV === "production" ? "DISABLED" : "SIMULATED";
  }

  if (configuredMode === "SIMULATED") {
    return "SIMULATED";
  }

  if (configuredMode === "MERCADOPAGO") {
    return hasMercadoPagoConfig() ? "MERCADOPAGO" : "DISABLED";
  }

  return "DISABLED";
}

export function isSimulatedPaymentEnabled() {
  return getTicketPaymentMode() === "SIMULATED";
}

export function isMercadoPagoEnabled() {
  return getTicketPaymentMode() === "MERCADOPAGO";
}

export function isAnyTicketPaymentEnabled() {
  return getTicketPaymentMode() !== "DISABLED";
}

export function getPaymentDisabledMessage() {
  const configuredMode = getConfiguredMode();

  if (configuredMode === "MERCADOPAGO" && !hasMercadoPagoConfig()) {
    return "Mercado Pago no esta configurado correctamente.";
  }

  return "El pago todavia no esta disponible.";
}

export function getMercadoPagoAccessToken() {
  return getMercadoPagoAccessTokenInternal();
}

export function getMercadoPagoWebhookSecret() {
  return getMercadoPagoWebhookSecretInternal();
}

export function getPublicAppUrl() {
  return getPublicAppUrlInternal();
}
