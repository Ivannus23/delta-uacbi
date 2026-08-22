import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { getPublicAppUrl } from "@/lib/tickets/config";

const MERCADO_PAGO_AUTH_BASE = "https://auth.mercadopago.com";
const MERCADO_PAGO_API_BASE = "https://api.mercadopago.com";
const STATE_TOLERANCE_MS = 10 * 60 * 1000;
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;

function normalize(value: string | undefined) {
  return (value || "").trim();
}

function getClientId() {
  return normalize(process.env.MERCADOPAGO_CLIENT_ID);
}

function getClientSecret() {
  return normalize(process.env.MERCADOPAGO_CLIENT_SECRET);
}

function getStateSecret() {
  const secret = normalize(process.env.AUTH_SECRET) || normalize(process.env.NEXTAUTH_SECRET);
  if (!secret) {
    throw new Error("AUTH_SECRET no esta configurada.");
  }
  return secret;
}

export function getMercadoPagoOAuthRedirectUri() {
  const configured = normalize(process.env.MERCADOPAGO_OAUTH_REDIRECT_URI);
  if (configured) return configured;

  const appUrl = getPublicAppUrl();
  if (!appUrl) return "";

  return `${appUrl}/api/semana-cultural/mercadopago/oauth/callback`;
}

export function isMercadoPagoMarketplaceConfigured() {
  return Boolean(getClientId() && getClientSecret() && getMercadoPagoOAuthRedirectUri());
}

export function getMercadoPagoMarketplaceMissingConfigKeys() {
  const missing: string[] = [];
  if (!getClientId()) missing.push("MERCADOPAGO_CLIENT_ID");
  if (!getClientSecret()) missing.push("MERCADOPAGO_CLIENT_SECRET");
  if (!getMercadoPagoOAuthRedirectUri()) missing.push("MERCADOPAGO_OAUTH_REDIRECT_URI (o NEXT_PUBLIC_APP_URL)");
  return missing;
}

export function signOAuthState(organizationId: string) {
  const timestamp = Date.now().toString();
  const payload = `${organizationId}:${timestamp}`;
  const signature = createHmac("sha256", getStateSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}:${signature}`, "utf8").toString("base64url");
}

export function verifyOAuthState(state: string): { organizationId: string } | null {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const [organizationId, timestamp, signature] = decoded.split(":");
    if (!organizationId || !timestamp || !signature) return null;

    const payload = `${organizationId}:${timestamp}`;
    const expected = createHmac("sha256", getStateSecret()).update(payload).digest("hex");

    const providedBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");
    if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
      return null;
    }

    if (Math.abs(Date.now() - Number(timestamp)) > STATE_TOLERANCE_MS) {
      return null;
    }

    return { organizationId };
  } catch {
    return null;
  }
}

export function getMercadoPagoAuthorizeUrl(state: string) {
  const params = new URLSearchParams({
    client_id: getClientId(),
    response_type: "code",
    platform_id: "mp",
    redirect_uri: getMercadoPagoOAuthRedirectUri(),
    state,
  });

  return `${MERCADO_PAGO_AUTH_BASE}/authorization?${params.toString()}`;
}

type MercadoPagoOAuthTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: number;
  scope?: string;
};

async function requestOAuthToken(body: Record<string, string>) {
  const response = await fetch(`${MERCADO_PAGO_API_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Mercado Pago OAuth respondio con estado ${response.status}.`);
  }

  return (await response.json()) as MercadoPagoOAuthTokenResponse;
}

export async function exchangeMercadoPagoOAuthCode(code: string) {
  return requestOAuthToken({
    grant_type: "authorization_code",
    client_id: getClientId(),
    client_secret: getClientSecret(),
    code,
    redirect_uri: getMercadoPagoOAuthRedirectUri(),
  });
}

export async function refreshMercadoPagoOAuthToken(refreshToken: string) {
  return requestOAuthToken({
    grant_type: "refresh_token",
    client_id: getClientId(),
    client_secret: getClientSecret(),
    refresh_token: refreshToken,
  });
}

export async function saveMercadoPagoAccount(organizationId: string, tokens: MercadoPagoOAuthTokenResponse) {
  const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  return db.organizationMercadoPagoAccount.upsert({
    where: { organizationId },
    update: {
      mercadoPagoUserId: String(tokens.user_id),
      accessTokenEnc: encryptSecret(tokens.access_token),
      refreshTokenEnc: encryptSecret(tokens.refresh_token),
      tokenExpiresAt,
      scope: tokens.scope ?? null,
    },
    create: {
      organizationId,
      mercadoPagoUserId: String(tokens.user_id),
      accessTokenEnc: encryptSecret(tokens.access_token),
      refreshTokenEnc: encryptSecret(tokens.refresh_token),
      tokenExpiresAt,
      scope: tokens.scope ?? null,
    },
  });
}

export async function resolveOrganizationMercadoPagoToken(organizationId: string): Promise<string> {
  const account = await db.organizationMercadoPagoAccount.findUnique({ where: { organizationId } });
  if (!account) {
    throw new Error("Esta organización no ha conectado su cuenta de Mercado Pago.");
  }

  if (account.tokenExpiresAt.getTime() - Date.now() > TOKEN_REFRESH_MARGIN_MS) {
    return decryptSecret(account.accessTokenEnc);
  }

  const refreshToken = decryptSecret(account.refreshTokenEnc);
  const refreshed = await refreshMercadoPagoOAuthToken(refreshToken);
  await saveMercadoPagoAccount(organizationId, refreshed);

  return refreshed.access_token;
}
