import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const pending = await prisma.project.findMany({ where: { state: "PENDING" }, orderBy: { createdAt: "desc" }});
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Panel de moderación</h1>
      <div className="grid gap-3">
        {pending.map(p => (
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
    </div>
  );
}
