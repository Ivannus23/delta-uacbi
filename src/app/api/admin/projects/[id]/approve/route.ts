import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.project.update({
      where: { id: params.id },
      data: { state: "PUBLISHED" },
    });
    // vuelve al panel
    return NextResponse.redirect(new URL("/admin", req.url));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "No se pudo aprobar" }, { status: 500 });
  }
}
