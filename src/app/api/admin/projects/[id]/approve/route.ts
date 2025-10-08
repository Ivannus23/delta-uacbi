import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const id = params.id;
  await prisma.project.update({
    where: { id },
    data: { state: "PUBLISHED" },
  });

  // vuelve al panel
  return NextResponse.redirect(new URL("/admin", req.url));
}
