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

  if (role !== "ADMIN" && role !== "STAFF") {
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
