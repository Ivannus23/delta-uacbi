// src/app/api/projects/route.ts
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const data = await req.json();
  try {
    await prisma.project.create({
      data: {
        slug: data.slug,
        titleES: data.titleES,
        titleEN: data.titleEN,
        summaryES: data.summaryES,
        summaryEN: data.summaryEN,
        descriptionES: data.descriptionES,
        descriptionEN: data.descriptionEN,
        stack: [],
        tags: [],
        images: [],
        state: "PENDING",
      },
    });
    return new Response(null, { status: 201 });
  } catch (e) {
    console.error(e);
    return new Response("error", { status: 500 });
  }
}
