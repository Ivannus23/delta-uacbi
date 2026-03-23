import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requireStaff() {
  const session = await requireUser();
  const role = (session.user as any).role;

  if (role !== "ADMIN" && role !== "STAFF") {
    redirect("/semana-cultural");
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  const role = (session.user as any).role;

  if (role !== "ADMIN") {
    redirect("/semana-cultural");
  }

  return session;
}