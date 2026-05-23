import Link from "next/link";
import { DigitalTicketStatus, TicketOrderStatus } from "@prisma/client";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { getSessionUserInfo, requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatTicketDate, formatTicketMoney } from "@/lib/tickets/format";
import { listRecentTicketOrders } from "@/lib/tickets/orders";

export const revalidate = 0;

export default async function TicketAdminOrdersPage() {
  const session = await requireStaff();
  const { role } = getSessionUserInfo(session.user);
  const [orders, stockByType] = await Promise.all([
    listRecentTicketOrders(100),
    db.ticketType.findMany({
      include: {
        event: {
          select: {
            title: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 60,
    }),
  ]);

  const ticketsByEvent = new Map<string, { eventTitle: string; tickets: number; orders: number; used: number }>();
  let paidOrders = 0;
  let pendingOrders = 0;
  let totalSoldAmount = 0;
  let totalUsedTickets = 0;

  for (const order of orders) {
    const current = ticketsByEvent.get(order.eventId) || {
      eventTitle: order.event.title,
      tickets: 0,
      orders: 0,
      used: 0,
    };
    current.orders += 1;
    current.tickets += order.digitalTickets.length;
    current.used += order.digitalTickets.filter((ticket) => ticket.status === DigitalTicketStatus.USED).length;
    ticketsByEvent.set(order.eventId, current);

    if (order.status === TicketOrderStatus.PAID) {
      paidOrders += 1;
      totalSoldAmount += Number(order.totalAmount);
    }
    if (order.status === TicketOrderStatus.PENDING) {
      pendingOrders += 1;
    }
    totalUsedTickets += order.digitalTickets.filter((ticket) => ticket.status === DigitalTicketStatus.USED).length;
  }

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <section className="card-next rounded-3xl p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Delta Tickets Admin</p>
          <h1 className="mt-2 text-3xl font-semibold">Ordenes y boletos emitidos</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Vista de consulta para STAFF y ADMIN. Las acciones sensibles se mantienen para ADMIN.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/tickets/admin"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              Volver al panel admin
            </Link>
            <span className="rounded-full border border-white/10 px-4 py-2 text-xs text-muted-foreground">
              Rol actual: {role || "SIN_ROL"}
            </span>
            <Link
              href="/tickets/admin/checkin"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              Ir a check-in
            </Link>
            <a
              href="/api/tickets/export/orders"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              Exportar ordenes
            </a>
            <a
              href="/api/tickets/export/tickets"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              Exportar boletos
            </a>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase text-muted-foreground">Total vendido</p>
              <p className="mt-2 text-2xl font-semibold">{formatTicketMoney(totalSoldAmount)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase text-muted-foreground">Ordenes pagadas</p>
              <p className="mt-2 text-2xl font-semibold">{paidOrders}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase text-muted-foreground">Ordenes pendientes</p>
              <p className="mt-2 text-2xl font-semibold">{pendingOrders}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase text-muted-foreground">Boletos usados</p>
              <p className="mt-2 text-2xl font-semibold">{totalUsedTickets}</p>
            </div>
          </div>
        </section>

        <section className="mt-8 card-next rounded-3xl p-6">
          <h2 className="text-2xl font-semibold">Resumen por evento</h2>
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-sm text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Evento</th>
                  <th className="px-4 py-3">Ordenes</th>
                  <th className="px-4 py-3">Boletos emitidos</th>
                </tr>
              </thead>
              <tbody>
                {ticketsByEvent.size ? (
                  Array.from(ticketsByEvent.entries()).map(([eventId, summary]) => (
                    <tr key={eventId} className="border-t border-white/10">
                      <td className="px-4 py-3 font-medium">{summary.eventTitle}</td>
                      <td className="px-4 py-3 text-muted-foreground">{summary.orders}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {summary.tickets} (usados: {summary.used})
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-muted-foreground">
                      Aun no hay ordenes registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 card-next rounded-3xl p-6">
          <h2 className="text-2xl font-semibold">Stock disponible por tipo</h2>
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-sm text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Evento</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Vendidos</th>
                  <th className="px-4 py-3">Disponibles</th>
                  <th className="px-4 py-3">Activo</th>
                </tr>
              </thead>
              <tbody>
                {stockByType.length ? (
                  stockByType.map((ticketType) => (
                    <tr key={ticketType.id} className="border-t border-white/10">
                      <td className="px-4 py-3 text-muted-foreground">{ticketType.event.title}</td>
                      <td className="px-4 py-3 font-medium">{ticketType.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{ticketType.quantity}</td>
                      <td className="px-4 py-3 text-muted-foreground">{ticketType.soldCount}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {Math.max(ticketType.quantity - ticketType.soldCount, 0)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{ticketType.isActive ? "SI" : "NO"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-muted-foreground">
                      No hay tipos de boleto registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 card-next rounded-3xl p-6">
          <h2 className="text-2xl font-semibold">Ordenes recientes</h2>
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-sm text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Orden</th>
                  <th className="px-4 py-3">Evento</th>
                  <th className="px-4 py-3">Comprador</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Boletos</th>
                  <th className="px-4 py-3">Creada</th>
                  <th className="px-4 py-3">Accion</th>
                </tr>
              </thead>
              <tbody>
                {orders.length ? (
                  orders.map((order) => (
                    <tr key={order.id} className="border-t border-white/10">
                      <td className="px-4 py-3 font-medium">{order.id}</td>
                      <td className="px-4 py-3 text-muted-foreground">{order.event.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {order.buyerName}
                        <div className="text-xs">{order.buyerEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatTicketMoney(Number(order.totalAmount))}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{order.digitalTickets.length}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatTicketDate(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/tickets/orden/${order.publicToken}`}
                          className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Ver orden
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-muted-foreground">
                      No hay ordenes recientes.
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
