import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import type { OrgRole } from "@prisma/client";

function getRole(user: unknown) {
  return typeof user === "object" &&
    user !== null &&
    "role" in user &&
    typeof user.role === "string"
    ? user.role
    : null;
}

export function getSessionUserInfo(user: unknown) {
  const role = getRole(user);
  const id =
    typeof user === "object" &&
    user !== null &&
    "id" in user &&
    typeof user.id === "string"
      ? user.id
      : null;
  const email =
    typeof user === "object" &&
    user !== null &&
    "email" in user &&
    typeof user.email === "string"
      ? user.email.toLowerCase()
      : null;

  return { role, id, email };
}

export function isStaffRole(role: string | null) {
  return role === "ADMIN" || role === "STAFF";
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requireStaff() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const role = getRole(session.user);

  if (!isStaffRole(role)) {
    redirect("/login");
  }

  return session;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const role = getRole(session.user);

  if (role !== "ADMIN") {
    redirect("/login");
  }

  return session;
}

// --- Permisos por organizacion (Semana Cultural multi-tenant) ---
// Un platformRole "ADMIN" (User.role) actua como superadmin: visibilidad y control
// total sobre cualquier organizacion, sin necesitar una fila de membresia.

export type OrgMembershipResult = {
  session: NonNullable<Awaited<ReturnType<typeof auth>>>;
  role: OrgRole;
  isPlatformAdmin: boolean;
};

async function resolveOrgMembership(
  organizationId: string,
  minRole: OrgRole
): Promise<OrgMembershipResult> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { role: platformRole, id: userId } = getSessionUserInfo(session.user);

  if (platformRole === "ADMIN") {
    return { session, role: "ADMIN", isPlatformAdmin: true };
  }

  const membership = userId
    ? await db.organizationMembership.findUnique({
        where: { userId_organizationId: { userId, organizationId } },
      })
    : null;

  if (!membership) {
    redirect("/semana-cultural");
  }

  if (minRole === "ADMIN" && membership.role !== "ADMIN") {
    redirect("/semana-cultural");
  }

  return { session, role: membership.role, isPlatformAdmin: false };
}

export async function requireOrgStaff(organizationId: string) {
  return resolveOrgMembership(organizationId, "STAFF");
}

export async function requireOrgAdmin(organizationId: string) {
  return resolveOrgMembership(organizationId, "ADMIN");
}

export async function getOrgRole(
  organizationId: string,
  userId: string | null,
  platformRole: string | null
): Promise<OrgRole | null> {
  if (platformRole === "ADMIN") {
    return "ADMIN";
  }
  if (!userId) return null;
  const membership = await db.organizationMembership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  return membership?.role ?? null;
}
