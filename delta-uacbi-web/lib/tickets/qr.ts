const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/+$/, "");

function ensureLeadingSlash(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

export function getAbsoluteUrl(path: string) {
  const normalizedPath = ensureLeadingSlash(path);
  if (!BASE_URL) {
    return normalizedPath;
  }
  return `${BASE_URL}${normalizedPath}`;
}

export function getDigitalTicketQrPayload(qrToken: string) {
  const encodedToken = encodeURIComponent(qrToken);
  return getAbsoluteUrl(`/tickets/validar/${encodedToken}`);
}
