import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { requireOrgStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveOrganization, getActiveEdition } from "@/lib/semana-cultural";
import { disconnectMercadoPagoAccount } from "./actions";

export const revalidate = 0;

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  CANCELLED: "Cancelado",
  EXPIRED: "Expirado",
};

export default async function AdminPagosPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ mercadopago?: string }>;
}) {
  const { orgSlug } = await params;
  const { mercadopago } = await searchParams;
  const organization = await resolveOrganization(orgSlug);
  const { role } = await requireOrgStaff(organization.id);
  const isAdmin = role === "ADMIN";

  const [edition, mpAccount] = await Promise.all([
    getActiveEdition(organization.id),
    db.organizationMercadoPagoAccount.findUnique({ where: { organizationId: organization.id } }),
  ]);

  const payments = edition
    ? await db.teamPayment.findMany({
        where: { editionId: edition.id },
        include: { team: { select: { animal: true, responsableNombre: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana orgSlug={orgSlug} edition={edition} />

        <section className="card-next rounded-3xl p-6">
          <h2 className="text-3xl font-semibold">Pagos</h2>
          <p className="mt-2 text-muted-foreground">
            Cuenta de Mercado Pago conectada y cuotas de inscripción pagadas por los equipos de esta
            edición. El dinero llega directo a la cuenta de Mercado Pago de esta organización — la
            plataforma nunca lo recibe.
          </p>

          {mercadopago === "connected" ? (
            <p className="mt-4 rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
              Cuenta de Mercado Pago conectada correctamente.
            </p>
          ) : null}
          {mercadopago === "error" || mercadopago === "invalid_state" ? (
            <p className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
              No se pudo conectar la cuenta de Mercado Pago. Intenta de nuevo.
            </p>
          ) : null}

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Cuenta de Mercado Pago
                </p>
                <p className="mt-1 font-medium">
                  {mpAccount ? `Conectada (usuario ${mpAccount.mercadoPagoUserId})` : "No conectada"}
                </p>
              </div>

              {isAdmin ? (
                mpAccount ? (
                  <form action={disconnectMercadoPagoAccount.bind(null, organization.id, orgSlug)}>
                    <button
                      type="submit"
                      className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
                    >
                      Desconectar
                    </button>
                  </form>
                ) : (
                  <a
                    href={`/api/semana-cultural/${orgSlug}/mercadopago/connect`}
                    className="btn-sheen rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                  >
                    Conectar Mercado Pago
                  </a>
                )
              ) : null}
            </div>
          </div>
        </section>

        <section className="card-next mt-6 rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-2xl font-semibold">Cuotas pagadas</h3>
            {edition ? (
              <a
                href={`/api/semana-cultural/${orgSlug}/export-payments`}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
              >
                Exportar CSV
              </a>
            ) : null}
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-sm text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Equipo</th>
                  <th className="px-4 py-3">Responsable</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {payments.length ? (
                  payments.map((payment) => (
                    <tr key={payment.id} className="border-t border-white/10">
                      <td className="px-4 py-3 font-medium">{payment.team.animal}</td>
                      <td className="px-4 py-3 text-muted-foreground">{payment.team.responsableNombre}</td>
                      <td className="px-4 py-3">${Number(payment.amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {STATUS_LABELS[payment.status] ?? payment.status}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {payment.createdAt.toLocaleDateString("es-MX")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-muted-foreground">
                      Aún no hay pagos registrados.
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
