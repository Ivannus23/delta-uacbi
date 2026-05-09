import { auth } from "@/auth";
import { redirect } from "next/navigation";

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
    redirect("/semana-cultural/staff");
  }
  const role = getRole(session.user);

  if (!isStaffRole(role)) {
    redirect("/semana-cultural/staff");
  }

  return session;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    redirect("/semana-cultural/staff");
  }
  const role = getRole(session.user);

  if (role !== "ADMIN") {
    redirect("/semana-cultural/staff");
  }

  return session;
}
