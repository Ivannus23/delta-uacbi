import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { escapeCsv } from "@/lib/csv";
import { resolveOrganizationMercadoPagoToken } from "@/lib/mercadopago-oauth";
import { createMercadoPagoPreference, getMercadoPagoPayment, type MercadoPagoPayment } from "@/lib/tickets/mercadopago";
import { getPublicAppUrl } from "@/lib/tickets/config";
import { Prisma, TeamPaymentStatus, type CulturalEdition, type Team } from "@prisma/client";

function createTeamPaymentToken() {
  return randomBytes(24).toString("hex");
}

function formatPhoneForMercadoPago(phone: string) {
  return phone.replace(/\D+/g, "").slice(-13) || phone;
}

async function createTeamPaymentWithToken(editionId: string, teamId: string, amount: Prisma.Decimal | number) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const publicToken = createTeamPaymentToken();

    try {
      return await db.teamPayment.create({
        data: { editionId, teamId, publicToken, amount },
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

  throw new Error("No se pudo generar un token de pago.");
}

async function loadTeamPaymentForUpdateTx(tx: Prisma.TransactionClient, paymentId: string) {
  await tx.$queryRaw`SELECT id FROM "TeamPayment" WHERE id = ${paymentId} FOR UPDATE`;
  return tx.teamPayment.findUnique({ where: { id: paymentId } });
}

export async function finalizeTeamPaymentAsPaid(paymentId: string, providerPaymentId: string) {
  return db.$transaction(async (tx) => {
    const payment = await loadTeamPaymentForUpdateTx(tx, paymentId);
    if (!payment) {
      throw new Error("Pago no encontrado.");
    }

    if (payment.status === TeamPaymentStatus.PAID) {
      return { status: "already_paid" as const, paymentId: payment.id };
    }

    if (payment.status !== TeamPaymentStatus.PENDING) {
      throw new Error(`El pago no se puede confirmar porque esta en estado ${payment.status}.`);
    }

    await tx.teamPayment.update({
      where: { id: payment.id },
      data: { status: TeamPaymentStatus.PAID, providerPaymentId },
    });

    return { status: "paid" as const, paymentId: payment.id };
  });
}

export async function canSimulateTeamPayment(organizationId: string) {
  if (process.env.NODE_ENV === "production") return false;

  const account = await db.organizationMercadoPagoAccount.findUnique({ where: { organizationId } });
  return !account;
}

export async function simulateTeamPaymentPaid(edition: CulturalEdition, team: Team) {
  if (edition.registrationFeeMode !== "FIXED" || !edition.registrationFeeAmount) {
    throw new Error("Esta edición no requiere cuota de inscripción.");
  }

  if (!(await canSimulateTeamPayment(edition.organizationId))) {
    throw new Error("El pago de prueba no está disponible.");
  }

  const alreadyPaid = await db.teamPayment.findFirst({
    where: { teamId: team.id, status: TeamPaymentStatus.PAID },
  });
  if (alreadyPaid) {
    throw new Error("Este equipo ya pagó su cuota de inscripción.");
  }

  let payment = await db.teamPayment.findFirst({
    where: { teamId: team.id, status: TeamPaymentStatus.PENDING },
    orderBy: { createdAt: "desc" },
  });
  if (!payment) {
    payment = await createTeamPaymentWithToken(edition.id, team.id, edition.registrationFeeAmount);
  }

  const result = await finalizeTeamPaymentAsPaid(payment.id, `sim:${payment.id}:${Date.now()}`);

  await createAuditLog({
    action: "SIMULATED_TEAM_PAYMENT_PAID",
    entityType: "TeamPayment",
    entityId: payment.id,
    detail: `Pago de prueba marcado como pagado para el equipo ${team.animal}.`,
    editionId: edition.id,
  });

  return result;
}

export async function initiateTeamPaymentCheckout(edition: CulturalEdition, team: Team, orgSlug: string) {
  if (edition.registrationFeeMode !== "FIXED" || !edition.registrationFeeAmount) {
    throw new Error("Esta edición no requiere cuota de inscripción.");
  }

  const alreadyPaid = await db.teamPayment.findFirst({
    where: { teamId: team.id, status: TeamPaymentStatus.PAID },
  });
  if (alreadyPaid) {
    throw new Error("Este equipo ya pagó su cuota de inscripción.");
  }

  const accessToken = await resolveOrganizationMercadoPagoToken(edition.organizationId);

  const appUrl = getPublicAppUrl();
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL no esta configurada.");
  }

  let payment = await db.teamPayment.findFirst({
    where: { teamId: team.id, status: TeamPaymentStatus.PENDING },
    orderBy: { createdAt: "desc" },
  });

  if (!payment) {
    payment = await createTeamPaymentWithToken(edition.id, team.id, edition.registrationFeeAmount);
  }

  const teamUrl = `${appUrl}/semana-cultural/${orgSlug}/equipos/${team.id}`;
  const notificationUrl = `${appUrl}/api/semana-cultural/payments/webhook?paymentToken=${encodeURIComponent(payment.publicToken)}`;

  const preference = await createMercadoPagoPreference({
    externalReference: payment.publicToken,
    accessToken,
    notificationUrl,
    successUrl: teamUrl,
    pendingUrl: teamUrl,
    failureUrl: teamUrl,
    payer: {
      name: team.responsableNombre,
      email: team.responsableCorreo,
      phone: formatPhoneForMercadoPago(team.responsableTelefono),
    },
    items: [
      {
        id: payment.id,
        title: `Cuota de inscripción – ${team.animal} – ${edition.name}`,
        quantity: 1,
        unit_price: Number(payment.amount),
        currency_id: "MXN",
      },
    ],
  });

  await createAuditLog({
    action: "MERCADOPAGO_TEAM_CHECKOUT_CREATED",
    entityType: "TeamPayment",
    entityId: payment.id,
    detail: `Preferencia creada ${preference.id} para el equipo ${team.animal}.`,
    editionId: edition.id,
  });

  return { checkoutUrl: preference.initPoint };
}

function mapMercadoPagoStatusToTeamPaymentStatus(payment: MercadoPagoPayment) {
  const status = String(payment.status || "").toLowerCase();

  if (status === "approved") return TeamPaymentStatus.PAID;
  if (status === "cancelled" || status === "rejected" || status === "charged_back") {
    return TeamPaymentStatus.CANCELLED;
  }
  if (status === "expired") return TeamPaymentStatus.EXPIRED;
  return TeamPaymentStatus.PENDING;
}

export async function processMercadoPagoTeamPayment(paymentToken: string, mercadoPagoPaymentId: string) {
  const payment = await db.teamPayment.findUnique({
    where: { publicToken: paymentToken },
    include: { edition: true },
  });
  if (!payment) {
    throw new Error("Pago no encontrado.");
  }

  const accessToken = await resolveOrganizationMercadoPagoToken(payment.edition.organizationId);
  const mpPayment = await getMercadoPagoPayment(mercadoPagoPaymentId, { accessToken });

  if (mpPayment.external_reference !== paymentToken) {
    throw new Error("El pago de Mercado Pago no corresponde a este token.");
  }

  const targetStatus = mapMercadoPagoStatusToTeamPaymentStatus(mpPayment);

  if (targetStatus === TeamPaymentStatus.PAID) {
    const result = await finalizeTeamPaymentAsPaid(payment.id, `mp:${mercadoPagoPaymentId}`);
    await createAuditLog({
      action:
        result.status === "already_paid"
          ? "MERCADOPAGO_TEAM_PAYMENT_DUPLICATE"
          : "MERCADOPAGO_TEAM_PAYMENT_PAID",
      entityType: "TeamPayment",
      entityId: payment.id,
      detail: `Pago ${mercadoPagoPaymentId} confirmado.`,
      editionId: payment.editionId,
    });
    return result;
  }

  await db.$transaction(async (tx) => {
    const locked = await loadTeamPaymentForUpdateTx(tx, payment.id);
    if (!locked || locked.status !== TeamPaymentStatus.PENDING) {
      return;
    }

    if (targetStatus === TeamPaymentStatus.PENDING) {
      return;
    }

    await tx.teamPayment.update({
      where: { id: locked.id },
      data: { status: targetStatus },
    });
  });

  await createAuditLog({
    action: "MERCADOPAGO_TEAM_PAYMENT_STATUS_UPDATED",
    entityType: "TeamPayment",
    entityId: payment.id,
    detail: `Pago ${mercadoPagoPaymentId} en estado ${targetStatus}.`,
    editionId: payment.editionId,
  });

  return { status: "updated_non_paid" as const, paymentId: payment.id };
}

export async function buildTeamPaymentsCsv(editionId: string) {
  const payments = await db.teamPayment.findMany({
    where: { editionId },
    include: { team: { select: { animal: true, responsableNombre: true, responsableCorreo: true } } },
    orderBy: { createdAt: "desc" },
  });

  const headers = ["Equipo", "Responsable", "Correo", "Monto", "Estado", "Fecha"];
  const rows = payments.map((payment) =>
    [
      payment.team.animal,
      payment.team.responsableNombre,
      payment.team.responsableCorreo,
      Number(payment.amount).toFixed(2),
      payment.status,
      payment.createdAt.toISOString(),
    ]
      .map(escapeCsv)
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
