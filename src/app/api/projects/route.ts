import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data?.slug || !data?.titleES || !data?.summaryES || !data?.descriptionES) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }
    await prisma.project.create({
      data: {
        slug: data.slug,
        titleES: data.titleES,
        titleEN: data.titleEN ?? data.titleES,
        summaryES: data.summaryES,
        summaryEN: data.summaryEN ?? data.summaryES,
        descriptionES: data.descriptionES,
        descriptionEN: data.descriptionEN ?? data.descriptionES,
        stack: [],
        tags: [],
        images: [],
        state: "PENDING",
      },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
