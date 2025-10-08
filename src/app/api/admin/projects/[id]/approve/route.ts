import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await prisma.project.update({ where: { id: params.id }, data: { state: "PUBLISHED" } });
  return NextResponse.redirect(new URL("/admin", req.url));
}
