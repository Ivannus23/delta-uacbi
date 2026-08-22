import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { requireOrgStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveOrganization, getActiveEdition } from "@/lib/semana-cultural";

export const revalidate = 60;

export default async function AuditoriaPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const organization = await resolveOrganization(orgSlug);
  await requireOrgStaff(organization.id);

  const edition = await getActiveEdition(organization.id);

  const logs = edition
    ? await db.auditLog.findMany({
        where: { editionId: edition.id },
        include: {
          createdBy: {
            select: {
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : [];

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana orgSlug={orgSlug} edition={edition} />

        <section className="card-next rounded-3xl p-6">
          <h2 className="text-3xl font-semibold">Auditoría</h2>
          <p className="mt-2 text-muted-foreground">
            Bitácora reciente de acciones realizadas en esta organización.
          </p>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-sm text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Acción</th>
                  <th className="px-4 py-3">Entidad</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Detalle</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {logs.length ? (
                  logs.map((log) => (
                    <tr key={log.id} className="border-t border-white/10">
                      <td className="px-4 py-3 font-medium">{log.action}</td>
                      <td className="px-4 py-3 text-muted-foreground">{log.entityType}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {log.createdBy?.email ?? "Sistema"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{log.detail ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Intl.DateTimeFormat("es-MX", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(log.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-muted-foreground">
                      Aún no hay eventos de auditoría registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
