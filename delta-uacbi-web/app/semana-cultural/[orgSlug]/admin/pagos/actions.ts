"use server";

import { createAuditLog } from "@/lib/audit";
import { requireOrgAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function disconnectMercadoPagoAccount(organizationId: string, orgSlug: string) {
  await requireOrgAdmin(organizationId);

  await db.organizationMercadoPagoAccount.deleteMany({ where: { organizationId } });

  await createAuditLog({
    action: "DISCONNECT_MERCADOPAGO_ACCOUNT",
    entityType: "Organization",
    entityId: organizationId,
    detail: "Se desconectó la cuenta de Mercado Pago.",
  });

  revalidatePath(`/semana-cultural/${orgSlug}/admin/pagos`);
}
