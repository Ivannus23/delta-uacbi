import { randomBytes, randomUUID } from "node:crypto";

function toUpperAlphaNumeric(value: string) {
  return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function createDigitalTicketToken() {
  return randomBytes(24).toString("hex");
}

export function createOrderPublicToken() {
  return randomBytes(24).toString("hex");
}

export function createDigitalTicketFolio(eventId: string) {
  const eventPrefix = toUpperAlphaNumeric(eventId).slice(0, 6).padEnd(6, "X");
  const randomPart = toUpperAlphaNumeric(randomUUID()).slice(0, 10).padEnd(10, "X");
  return `DLT-${eventPrefix}-${randomPart}`;
}
