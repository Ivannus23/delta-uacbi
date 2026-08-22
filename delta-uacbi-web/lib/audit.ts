import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function createAuditLog(params: {
  action: string;
  entityType: string;
  entityId?: string;
  detail?: string;
  editionId?: string;
  createdById?: string | null;
}) {
  let createdById = params.createdById ?? null;

  if (!createdById) {
    const session = await auth();
    const sessionUser = session?.user;
    createdById =
      sessionUser &&
      typeof sessionUser === "object" &&
      "id" in sessionUser &&
      typeof sessionUser.id === "string"
        ? sessionUser.id
        : null;
  }

  await db.auditLog.create({
    data: {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      detail: params.detail,
      editionId: params.editionId,
      createdById,
    },
  });
}
