"use server";

import { revalidatePath } from "next/cache";
import {
  createPendingTicketOrder,
  normalizeTicketError,
  simulateOrderPaymentByPublicToken,
} from "@/lib/tickets/orders";
import { getPaymentDisabledMessage, isAnyTicketPaymentEnabled, isSimulatedPaymentEnabled } from "@/lib/tickets/config";

export type TicketPurchaseActionState = {
  status: "idle" | "success" | "error";
  message: string;
  publicToken: string | null;
};

export type TicketPaymentActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const INITIAL_TICKET_PURCHASE_STATE: TicketPurchaseActionState = {
  status: "idle",
  message: "",
  publicToken: null,
};

export const INITIAL_TICKET_PAYMENT_STATE: TicketPaymentActionState = {
  status: "idle",
  message: "",
};

function parseTicketSelections(formData: FormData) {
  const selections: Array<{ ticketTypeId: string; quantity: number }> = [];

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("qty_")) {
      continue;
    }

    const ticketTypeId = key.slice(4).trim();
    if (!ticketTypeId) {
      continue;
    }

    const quantity = Number(String(value || "0").trim());
    if (!Number.isFinite(quantity) || quantity <= 0) {
      continue;
    }

    selections.push({
      ticketTypeId,
      quantity: Math.floor(quantity),
    });
  }

  return selections;
}

export async function createTicketOrderWithState(
  eventId: string,
  _prevState: TicketPurchaseActionState = INITIAL_TICKET_PURCHASE_STATE,
  formData: FormData
): Promise<TicketPurchaseActionState> {
  void _prevState;
  try {
    if (!isAnyTicketPaymentEnabled()) {
      return {
        status: "error",
        message: getPaymentDisabledMessage(),
        publicToken: null,
      };
    }

    const buyerName = String(formData.get("buyerName") || "").trim();
    const buyerEmail = String(formData.get("buyerEmail") || "").trim();
    const buyerPhone = String(formData.get("buyerPhone") || "").trim();
    const selections = parseTicketSelections(formData);

    const order = await createPendingTicketOrder({
      eventId,
      buyerName,
      buyerEmail,
      buyerPhone,
      selections,
    });

    revalidatePath(`/tickets/eventos/${eventId}`);
    revalidatePath(`/tickets/orden/${order.publicToken}`);
    revalidatePath("/tickets/admin");
    revalidatePath("/tickets/admin/ordenes");

    return {
      status: "success",
      message: "Orden creada correctamente.",
      publicToken: order.publicToken,
    };
  } catch (error) {
    return {
      status: "error",
      message: normalizeTicketError(error),
      publicToken: null,
    };
  }
}

export async function confirmSimulatedPaymentWithState(
  publicToken: string,
  _prevState: TicketPaymentActionState = INITIAL_TICKET_PAYMENT_STATE,
  _formData?: FormData
): Promise<TicketPaymentActionState> {
  void _prevState;
  void _formData;
  try {
    if (!isSimulatedPaymentEnabled()) {
      return {
        status: "error",
        message: getPaymentDisabledMessage(),
      };
    }

    const result = await simulateOrderPaymentByPublicToken(publicToken);

    revalidatePath(`/tickets/orden/${publicToken}`);
    revalidatePath("/tickets/admin");
    revalidatePath("/tickets/admin/ordenes");

    return {
      status: "success",
      message:
        result.status === "already_paid"
          ? "Esta orden ya fue pagada."
          : "Pago simulado confirmado. Boletos emitidos.",
    };
  } catch (error) {
    return {
      status: "error",
      message: normalizeTicketError(error),
    };
  }
}
