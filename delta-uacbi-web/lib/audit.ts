import { db } from "@/lib/db";

export async function createAuditLog(params: {
  action: string;
  entityType: string;
  entityId?: string;
  detail?: string;
}) {
  await db.auditLog.create({
    data: {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      detail: params.detail,
    },
  });
}
