import { prisma } from "@/lib/prisma";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.project.update({ where: { id: params.id }, data: { state: "PUBLISHED" }});
    return new Response(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return new Response("error", { status: 500 });
  }
}
