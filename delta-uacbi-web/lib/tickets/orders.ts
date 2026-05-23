import { Prisma, TicketEventStatus, TicketOrderStatus, TicketPaymentProvider } from "@prisma/client";
import { db } from "@/lib/db";
import {
  getPaymentDisabledMessage,
  getPublicAppUrl,
  isMercadoPagoEnabled,
  isSimulatedPaymentEnabled,
} from "@/lib/tickets/config";
import {
  createMercadoPagoPreference,
  type MercadoPagoPayment,
  MercadoPagoError,
} from "@/lib/tickets/mercadopago";
import { createDigitalTicketFolio, createDigitalTicketToken, createOrderPublicToken } from "@/lib/tickets/tickets";

type TicketSelection = {
  ticketTypeId: string;
  quantity: number;
};

type CreateOrderInput = {
  eventId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  selections: TicketSelection[];
};

type TicketOrderForPayment = Prisma.TicketOrderGetPayload<{
  include: {
    event: true;
    items: {
      include: {
        ticketType: true;
      };
      orderBy: [{ id: "asc" }];
    };
    digitalTickets: true;
  };
}>;

type FinalizePaidOrderOptions = {
  provider: TicketPaymentProvider;
  providerPaymentId: string;
  auditActionPrefix: "SIMULATED" | "MERCADOPAGO";
};

export class TicketDomainError extends Error {}

function parsePositiveInteger(value: number) {
  return Number.isInteger(value) && value > 0 ? value : null;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function toCents(value: Prisma.Decimal | number) {
  return Math.round(Number(value) * 100);
}

function centsToDecimal(cents: number) {
  return new Prisma.Decimal((cents / 100).toFixed(2));
}

function formatPhoneForMercadoPago(phone: string) {
  return phone.replace(/\D+/g, "").slice(-13) || phone;
}

function assertValidBuyer(input: Pick<CreateOrderInput, "buyerName" | "buyerEmail" | "buyerPhone">) {
  const buyerName = input.buyerName.trim();
  const buyerEmail = normalizeEmail(input.buyerEmail);
  const buyerPhone = input.buyerPhone.trim();

  if (buyerName.length < 3) {
    throw new TicketDomainError("El nombre del comprador es obligatorio.");
  }
  if (!buyerEmail || !buyerEmail.includes("@")) {
    throw new TicketDomainError("El correo del comprador no es valido.");
  }
  if (buyerPhone.length < 8) {
    throw new TicketDomainError("El telefono del comprador no es valido.");
  }

  return {
    buyerName,
    buyerEmail,
    buyerPhone,
  };
}

function normalizeSelections(selections: TicketSelection[]) {
  const merged = new Map<string, number>();

  for (const selection of selections) {
    const ticketTypeId = selection.ticketTypeId.trim();
    if (!ticketTypeId) {
      continue;
    }
    const quantity = parsePositiveInteger(selection.quantity);
    if (!quantity) {
      continue;
    }
    merged.set(ticketTypeId, (merged.get(ticketTypeId) || 0) + quantity);
  }

  return Array.from(merged.entries()).map(([ticketTypeId, quantity]) => ({
    ticketTypeId,
    quantity,
  }));
}

export function normalizeTicketError(error: unknown) {
  if (error instanceof TicketDomainError) {
    return error.message;
  }

  if (error instanceof MercadoPagoError) {
    return error.message;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "Conflicto de datos en la orden. Intenta nuevamente.";
    }
    if (error.code === "P2025") {
      return "Orden no encontrada.";
    }
    return "No se pudo completar la operacion.";
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientValidationError
  ) {
    return "No se pudo completar la operacion.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudo completar la operacion.";
}

async function createOrderWithPublicToken(args: {
  tx: Prisma.TransactionClient;
  data: Omit<Prisma.TicketOrderCreateInput, "publicToken">;
}) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const publicToken = createOrderPublicToken();

    try {
      return await args.tx.ticketOrder.create({
        data: {
          ...args.data,
          publicToken,
        },
        select: {
          id: true,
          publicToken: true,
          eventId: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        Array.isArray(error.meta?.target) &&
        error.meta.target.some((item) => String(item).includes("publicToken"))
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new TicketDomainError("No se pudo generar un token publico de orden.");
}

async function createDigitalTicketSafe(args: {
  tx: Prisma.TransactionClient;
  orderId: string;
  eventId: string;
  ticketTypeId: string;
}) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const folio = createDigitalTicketFolio(args.eventId);
    const qrToken = createDigitalTicketToken();

    try {
      return await args.tx.digitalTicket.create({
        data: {
          orderId: args.orderId,
          eventId: args.eventId,
          ticketTypeId: args.ticketTypeId,
          folio,
          qrToken,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        Array.isArray(error.meta?.target) &&
        error.meta.target.some((item) => {
          const value = String(item);
          return value.includes("folio") || value.includes("qrToken");
        })
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new TicketDomainError("No se pudo emitir un boleto digital.");
}

async function loadOrderForPaymentTx(tx: Prisma.TransactionClient, orderId: string) {
  await tx.$queryRaw`
    SELECT id
    FROM "TicketOrder"
    WHERE id = ${orderId}
    FOR UPDATE
  `;

  return tx.ticketOrder.findUnique({
    where: { id: orderId },
    include: {
      event: true,
      items: {
        include: {
          ticketType: true,
        },
        orderBy: [{ id: "asc" }],
      },
      digitalTickets: true,
    },
  });
}

async function lockTicketTypesTx(tx: Prisma.TransactionClient, ticketTypeIds: string[]) {
  if (!ticketTypeIds.length) {
    return;
  }

  await tx.$queryRaw(
    Prisma.sql`
      SELECT id
      FROM "TicketType"
      WHERE id IN (${Prisma.join(ticketTypeIds)})
      FOR UPDATE
    `
  );
}

async function assertOrderStockAndStateTx(tx: Prisma.TransactionClient, order: TicketOrderForPayment) {
  if (order.status !== TicketOrderStatus.PENDING) {
    if (order.status === TicketOrderStatus.PAID) {
      return "already_paid" as const;
    }
    throw new TicketDomainError(`La orden no se puede pagar porque esta en estado ${order.status}.`);
  }

  if (order.event.status !== TicketEventStatus.PUBLISHED) {
    throw new TicketDomainError("El evento ya no esta disponible.");
  }

  const ticketTypeIds = order.items.map((item) => item.ticketTypeId);
  if (!ticketTypeIds.length) {
    throw new TicketDomainError("La orden no contiene boletos.");
  }

  await lockTicketTypesTx(tx, ticketTypeIds);

  const freshTicketTypes = await tx.ticketType.findMany({
    where: {
      id: { in: ticketTypeIds },
    },
  });
  const freshTicketTypeById = new Map(freshTicketTypes.map((ticketType) => [ticketType.id, ticketType]));

  for (const item of order.items) {
    const ticketType = freshTicketTypeById.get(item.ticketTypeId);
    if (!ticketType || ticketType.eventId !== order.eventId) {
      throw new TicketDomainError("El tipo de boleto no pertenece al evento.");
    }
    if (!ticketType.isActive) {
      throw new TicketDomainError("El tipo de boleto ya no esta activo.");
    }

    const available = ticketType.quantity - ticketType.soldCount;
    if (item.quantity > available) {
      throw new TicketDomainError("No hay boletos suficientes disponibles.");
    }
  }

  return "pending" as const;
}

async function writeAuditTx(
  tx: Prisma.TransactionClient,
  action: string,
  entityId: string,
  detail: string
) {
  await tx.ticketAuditLog.create({
    data: {
      action,
      entityType: "TicketOrder",
      entityId,
      detail,
    },
  });
}

async function finalizePaidOrderTx(
  tx: Prisma.TransactionClient,
  order: TicketOrderForPayment,
  options: FinalizePaidOrderOptions
) {
  for (const item of order.items) {
    await tx.ticketType.update({
      where: { id: item.ticketTypeId },
      data: {
        soldCount: {
          increment: item.quantity,
        },
      },
    });
  }

  await tx.ticketOrder.update({
    where: { id: order.id },
    data: {
      status: TicketOrderStatus.PAID,
      paymentProvider: options.provider,
      providerPaymentId: options.providerPaymentId,
    },
  });

  let emittedCount = 0;
  if (order.digitalTickets.length === 0) {
    for (const item of order.items) {
      for (let index = 0; index < item.quantity; index += 1) {
        await createDigitalTicketSafe({
          tx,
          orderId: order.id,
          eventId: order.eventId,
          ticketTypeId: item.ticketTypeId,
        });
        emittedCount += 1;
      }
    }
  } else {
    await writeAuditTx(
      tx,
      `${options.auditActionPrefix}_PAYMENT_SKIP_TICKET_EMISSION`,
      order.id,
      "La orden ya tenia boletos emitidos."
    );
  }

  await writeAuditTx(
    tx,
    `${options.auditActionPrefix}_PAYMENT_PAID`,
    order.id,
    `${options.auditActionPrefix} pago confirmado.`
  );

  if (emittedCount > 0) {
    await writeAuditTx(
      tx,
      "DIGITAL_TICKETS_EMITTED",
      order.id,
      `Boletos emitidos: ${emittedCount}.`
    );
  }

  return emittedCount;
}

async function settlePendingOrderAsPaid(
  orderId: string,
  options: FinalizePaidOrderOptions
): Promise<{
  status: "paid" | "already_paid";
  orderId: string;
  publicToken: string;
  emittedCount: number;
}> {
  return db.$transaction(async (tx) => {
    const order = await loadOrderForPaymentTx(tx, orderId);
    if (!order) {
      throw new TicketDomainError("Orden no encontrada.");
    }

    const state = await assertOrderStockAndStateTx(tx, order);
    if (state === "already_paid") {
      await writeAuditTx(
        tx,
        `${options.auditActionPrefix}_PAYMENT_DUPLICATE_ATTEMPT`,
        order.id,
        "Intento duplicado de confirmacion de pago en orden ya pagada."
      );
      return {
        status: "already_paid" as const,
        orderId: order.id,
        publicToken: order.publicToken,
        emittedCount: 0,
      };
    }

    const emittedCount = await finalizePaidOrderTx(tx, order, options);
    return {
      status: "paid" as const,
      orderId: order.id,
      publicToken: order.publicToken,
      emittedCount,
    };
  });
}

export async function createPendingTicketOrder(input: CreateOrderInput) {
  const eventId = input.eventId.trim();
  if (!eventId) {
    throw new TicketDomainError("Evento invalido.");
  }

  const buyer = assertValidBuyer(input);
  const selections = normalizeSelections(input.selections);
  const paymentProviderForPending = isMercadoPagoEnabled()
    ? TicketPaymentProvider.MERCADOPAGO
    : TicketPaymentProvider.SIMULATED;
  if (!selections.length) {
    throw new TicketDomainError("Selecciona al menos un boleto.");
  }

  const createdOrder = await db.$transaction(async (tx) => {
    const event = await tx.ticketEvent.findUnique({
      where: { id: eventId },
      include: {
        ticketTypes: true,
      },
    });

    if (!event || event.status !== TicketEventStatus.PUBLISHED) {
      throw new TicketDomainError("El evento ya no esta disponible.");
    }

    const ticketTypeById = new Map(event.ticketTypes.map((ticketType) => [ticketType.id, ticketType]));
    const preparedItems: Array<{ ticketTypeId: string; quantity: number; unitPriceCents: number; subtotalCents: number }> =
      [];
    let totalCents = 0;

    for (const selection of selections) {
      const ticketType = ticketTypeById.get(selection.ticketTypeId);
      if (!ticketType) {
        throw new TicketDomainError("El tipo de boleto no pertenece a este evento.");
      }
      if (!ticketType.isActive) {
        throw new TicketDomainError("El tipo de boleto ya no esta activo.");
      }
      if (selection.quantity > ticketType.maxPerOrder) {
        throw new TicketDomainError(`El maximo por orden para ${ticketType.name} es ${ticketType.maxPerOrder}.`);
      }

      const available = ticketType.quantity - ticketType.soldCount;
      if (selection.quantity > available) {
        throw new TicketDomainError("No hay boletos suficientes disponibles.");
      }

      const unitPriceCents = toCents(ticketType.price);
      const subtotalCents = unitPriceCents * selection.quantity;
      totalCents += subtotalCents;

      preparedItems.push({
        ticketTypeId: ticketType.id,
        quantity: selection.quantity,
        unitPriceCents,
        subtotalCents,
      });
    }

    const order = await createOrderWithPublicToken({
      tx,
      data: {
        event: {
          connect: { id: event.id },
        },
        buyerName: buyer.buyerName,
        buyerEmail: buyer.buyerEmail,
        buyerPhone: buyer.buyerPhone,
        totalAmount: centsToDecimal(totalCents),
        status: TicketOrderStatus.PENDING,
        paymentProvider: paymentProviderForPending,
        items: {
          create: preparedItems.map((item) => ({
            ticketTypeId: item.ticketTypeId,
            quantity: item.quantity,
            unitPrice: centsToDecimal(item.unitPriceCents),
            subtotal: centsToDecimal(item.subtotalCents),
          })),
        },
      },
    });

    await tx.ticketAuditLog.create({
      data: {
        action: "CREATE_TICKET_ORDER",
        entityType: "TicketOrder",
        entityId: order.id,
        detail: `Se creo orden pendiente ${order.id}.`,
      },
    });

    return order;
  });

  return createdOrder;
}

export async function getTicketOrderById(orderId: string) {
  return db.ticketOrder.findUnique({
    where: { id: orderId },
    include: {
      event: true,
      items: {
        include: {
          ticketType: true,
        },
        orderBy: [{ id: "asc" }],
      },
      digitalTickets: {
        include: {
          ticketType: true,
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      },
    },
  });
}

export async function getTicketOrderByPublicToken(publicToken: string) {
  return db.ticketOrder.findUnique({
    where: { publicToken },
    include: {
      event: true,
      items: {
        include: {
          ticketType: true,
        },
        orderBy: [{ id: "asc" }],
      },
      digitalTickets: {
        include: {
          ticketType: true,
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      },
    },
  });
}

export async function listRecentTicketOrders(limit = 50) {
  return db.ticketOrder.findMany({
    include: {
      event: true,
      items: {
        include: {
          ticketType: true,
        },
      },
      digitalTickets: true,
    },
    orderBy: [{ createdAt: "desc" }],
    take: limit,
  });
}

export async function simulateOrderPayment(orderId: string) {
  if (!isSimulatedPaymentEnabled()) {
    throw new TicketDomainError(getPaymentDisabledMessage());
  }

  return settlePendingOrderAsPaid(orderId, {
    provider: TicketPaymentProvider.SIMULATED,
    providerPaymentId: `sim:${orderId}:${Date.now()}`,
    auditActionPrefix: "SIMULATED",
  });
}

export async function simulateOrderPaymentByPublicToken(publicToken: string) {
  const order = await db.ticketOrder.findUnique({
    where: { publicToken },
    select: {
      id: true,
    },
  });

  if (!order) {
    throw new TicketDomainError("Orden no encontrada.");
  }

  return simulateOrderPayment(order.id);
}

export async function createMercadoPagoCheckoutByPublicToken(publicToken: string) {
  if (!isMercadoPagoEnabled()) {
    throw new TicketDomainError(getPaymentDisabledMessage());
  }

  const appUrl = getPublicAppUrl();
  if (!appUrl) {
    throw new TicketDomainError("NEXT_PUBLIC_APP_URL no esta configurada.");
  }

  const order = await db.ticketOrder.findUnique({
    where: { publicToken },
    include: {
      event: true,
      items: {
        include: {
          ticketType: true,
        },
        orderBy: [{ id: "asc" }],
      },
    },
  });

  if (!order) {
    throw new TicketDomainError("Orden no encontrada.");
  }

  if (order.status === TicketOrderStatus.PAID) {
    throw new TicketDomainError("Esta orden ya fue pagada.");
  }
  if (order.status !== TicketOrderStatus.PENDING) {
    throw new TicketDomainError(`La orden no se puede pagar porque esta en estado ${order.status}.`);
  }
  if (order.event.status !== TicketEventStatus.PUBLISHED) {
    throw new TicketDomainError("El evento ya no esta disponible.");
  }
  if (!order.items.length) {
    throw new TicketDomainError("La orden no contiene boletos.");
  }

  await db.$transaction(async (tx) => {
    const lockedOrder = await loadOrderForPaymentTx(tx, order.id);
    if (!lockedOrder) {
      throw new TicketDomainError("Orden no encontrada.");
    }
    const state = await assertOrderStockAndStateTx(tx, lockedOrder);
    if (state === "already_paid") {
      throw new TicketDomainError("Esta orden ya fue pagada.");
    }
  });

  const notificationUrl = `${appUrl}/api/tickets/payments/webhook`;
  const orderUrl = `${appUrl}/tickets/orden/${encodeURIComponent(order.publicToken)}`;
  const preference = await createMercadoPagoPreference({
    externalReference: order.publicToken,
    notificationUrl,
    successUrl: orderUrl,
    pendingUrl: orderUrl,
    failureUrl: orderUrl,
    payer: {
      name: order.buyerName,
      email: order.buyerEmail,
      phone: formatPhoneForMercadoPago(order.buyerPhone),
    },
    items: order.items.map((item) => ({
      id: item.ticketTypeId,
      title: `${order.event.title} - ${item.ticketType.name}`,
      quantity: item.quantity,
      unit_price: Number(item.unitPrice),
      currency_id: "MXN",
    })),
  });

  await db.$transaction(async (tx) => {
    const updated = await tx.ticketOrder.updateMany({
      where: {
        id: order.id,
        status: TicketOrderStatus.PENDING,
      },
      data: {
        paymentProvider: TicketPaymentProvider.MERCADOPAGO,
        providerPaymentId: `pref:${preference.id}`,
      },
    });

    if (updated.count === 0) {
      throw new TicketDomainError("Esta orden ya no esta disponible para pago.");
    }

    await writeAuditTx(
      tx,
      "MERCADOPAGO_CHECKOUT_CREATED",
      order.id,
      `Preferencia creada ${preference.id}.`
    );
  });

  return {
    preferenceId: preference.id,
    checkoutUrl: preference.initPoint,
    orderPublicToken: order.publicToken,
  };
}

function mapMercadoPagoStatusToOrderStatus(payment: MercadoPagoPayment) {
  const status = String(payment.status || "").toLowerCase();

  if (status === "approved") {
    return TicketOrderStatus.PAID;
  }
  if (status === "cancelled" || status === "rejected" || status === "charged_back") {
    return TicketOrderStatus.CANCELLED;
  }
  if (status === "refunded") {
    return TicketOrderStatus.REFUNDED;
  }
  if (status === "expired") {
    return TicketOrderStatus.EXPIRED;
  }
  return TicketOrderStatus.PENDING;
}

export async function processMercadoPagoPayment(payment: MercadoPagoPayment) {
  const externalReference = String(payment.external_reference || "").trim();
  if (!externalReference) {
    throw new TicketDomainError("El pago de Mercado Pago no incluye external_reference.");
  }

  const paymentId = String(payment.id || "").trim();
  if (!paymentId) {
    throw new TicketDomainError("El pago de Mercado Pago no incluye id.");
  }

  const targetStatus = mapMercadoPagoStatusToOrderStatus(payment);
  const order = await db.ticketOrder.findUnique({
    where: {
      publicToken: externalReference,
    },
    select: {
      id: true,
      publicToken: true,
      status: true,
    },
  });

  if (!order) {
    throw new TicketDomainError("Orden no encontrada.");
  }

  if (targetStatus === TicketOrderStatus.PAID) {
    return settlePendingOrderAsPaid(order.id, {
      provider: TicketPaymentProvider.MERCADOPAGO,
      providerPaymentId: `mp:${paymentId}`,
      auditActionPrefix: "MERCADOPAGO",
    });
  }

  await db.$transaction(async (tx) => {
    const lockedOrder = await loadOrderForPaymentTx(tx, order.id);
    if (!lockedOrder) {
      throw new TicketDomainError("Orden no encontrada.");
    }

    if (lockedOrder.status === TicketOrderStatus.PAID) {
      await writeAuditTx(
        tx,
        "MERCADOPAGO_STATUS_IGNORED_ALREADY_PAID",
        lockedOrder.id,
        `Pago ${paymentId} recibido con estado ${targetStatus}, ignorado por orden ya pagada.`
      );
      return;
    }

    if (targetStatus === TicketOrderStatus.PENDING) {
      await writeAuditTx(
        tx,
        "MERCADOPAGO_STATUS_PENDING",
        lockedOrder.id,
        `Pago ${paymentId} en estado pending/in_process.`
      );
      return;
    }

    await tx.ticketOrder.update({
      where: {
        id: lockedOrder.id,
      },
      data: {
        status: targetStatus,
        paymentProvider: TicketPaymentProvider.MERCADOPAGO,
        providerPaymentId: `mp:${paymentId}`,
      },
    });

    await writeAuditTx(
      tx,
      "MERCADOPAGO_STATUS_UPDATED",
      lockedOrder.id,
      `Orden actualizada a ${targetStatus} por pago ${paymentId}.`
    );
  });

  return {
    status: "updated_non_paid" as const,
    orderId: order.id,
    publicToken: order.publicToken,
    emittedCount: 0,
  };
}

export async function getDigitalTicketByQrToken(qrToken: string) {
  return db.digitalTicket.findUnique({
    where: { qrToken },
    include: {
      event: true,
      ticketType: true,
      order: {
        include: {
          items: {
            include: {
              ticketType: true,
            },
          },
        },
      },
    },
  });
}
