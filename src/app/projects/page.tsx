import { prisma } from "@/lib/prisma";
import Link from "next/link";

type ProjectCard = {
  id: string;
  slug: string;
  titleES: string;
  summaryES: string;
};

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    where: { state: "PUBLISHED" },            // usa string literal
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, titleES: true, summaryES: true },
  });

  type Row = (typeof projects)[number];       // infiere el tipo de cada fila

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Proyectos</h1>
        <Link className="px-3 py-2 rounded-xl border" href="/projects/new">
          Enviar proyecto
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-neutral-600">Aún no hay proyectos publicados.</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {projects.map((p: Row) => (
            <Link key={p.id} href={`/projects/${p.slug}`} className="card p-4 block">
              <h3 className="font-semibold">{p.titleES}</h3>
              <p className="text-sm text-neutral-600 line-clamp-3">{p.summaryES}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
