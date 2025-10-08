// src/app/admin/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

type PendingRow = { id: string; slug: string; titleES: string; summaryES: string };
type CountRow = { state: string; _count: { _all: number } };

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin?callbackUrl=/admin");

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Panel de moderación</h1>
        <p className="text-sm text-neutral-600">No tienes permisos para ver esta página.</p>
        <Link href="/" className="underline">Volver al inicio</Link>
      </div>
    );
  }

  const [pending, counts] = await Promise.all([
    prisma.project.findMany({
      where: { state: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: { id: true, slug: true, titleES: true, summaryES: true },
    }),
    prisma.project.groupBy({ by: ["state"], _count: { _all: true } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Panel de moderación</h1>

      <div className="text-sm text-neutral-600">
        {counts.map((c: CountRow) => (
          <span key={`${c.state}`} className="mr-3">
            {c.state}: {c._count._all}
          </span>
        ))}
      </div>

      {pending.length === 0 ? (
        <p className="text-sm text-neutral-600">No hay proyectos pendientes por ahora.</p>
      ) : (
        <div className="grid gap-3">
          {pending.map((p: PendingRow) => (
            <div key={p.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{p.titleES}</h3>
                  <p className="text-sm text-neutral-600">{p.summaryES}</p>
                </div>
                <form action={`/api/admin/projects/${p.id}/approve`} method="post">
                  <button className="px-3 py-2 rounded-xl border">Aprobar</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
