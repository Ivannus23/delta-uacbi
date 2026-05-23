import Link from "next/link";
import { DigitalTicketStatus, TicketEventStatus, TicketOrderStatus } from "@prisma/client";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { AdminTicketEventForm } from "@/components/tickets/AdminTicketEventForm";
import { AdminTicketTypeForm } from "@/components/tickets/AdminTicketTypeForm";
import { getSessionUserInfo, requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatTicketDate, formatTicketMoney } from "@/lib/tickets/format";

export const revalidate = 0;

export default async function TicketAdminPage() {
  const session = await requireStaff();
  const { role } = getSessionUserInfo(session.user);
  const isAdmin = role === "ADMIN";

  const [events, ordersSnapshot, emittedTickets, usedTickets] = await Promise.all([
    db.ticketEvent.findMany({
      include: {
        ticketTypes: {
          orderBy: [{ createdAt: "desc" }],
        },
      },
      orderBy: [{ eventDate: "desc" }, { title: "asc" }],
    }),
    db.ticketOrder.findMany({
      select: {
        status: true,
        totalAmount: true,
      },
    }),
    db.digitalTicket.count(),
    db.digitalTicket.count({
      where: { status: DigitalTicketStatus.USED },
    }),
  ]);

  const eventsForTypeForm = events.map((event) => ({
    id: event.id,
    title: event.title,
    status: event.status,
  }));

  const publishedCount = events.filter((event) => event.status === TicketEventStatus.PUBLISHED).length;
  const paidOrders = ordersSnapshot.filter((order) => order.status === TicketOrderStatus.PAID).length;
  const pendingOrders = ordersSnapshot.filter((order) => order.status === TicketOrderStatus.PENDING).length;
  const totalSoldAmount = ordersSnapshot.reduce((acc, order) => {
    if (order.status !== TicketOrderStatus.PAID) {
      return acc;
    }
    return acc + Number(order.totalAmount);
  }, 0);
  const totalAvailableStock = events.reduce(
    (acc, event) => acc + event.ticketTypes.reduce((sum, type) => sum + Math.max(type.quantity - type.soldCount, 0), 0),
    0
  );

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <section className="card-next rounded-3xl p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Delta Tickets Admin</p>
          <h1 className="mt-2 text-3xl font-semibold">Panel de eventos y tipos de boleto</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Control operativo del modulo Delta Tickets. En esta fase se habilita alta de eventos y catalogo de
            boletos.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase text-muted-foreground">Eventos totales</p>
              <p className="mt-2 text-2xl font-semibold">{events.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase text-muted-foreground">Eventos publicados</p>
              <p className="mt-2 text-2xl font-semibold">{publishedCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase text-muted-foreground">Rol actual</p>
              <p className="mt-2 text-2xl font-semibold">{role || "SIN_ROL"}</p>
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase text-muted-foreground">Total vendido</p>
              <p className="mt-2 text-2xl font-semibold">{formatTicketMoney(totalSoldAmount)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase text-muted-foreground">Ordenes pagadas / pendientes</p>
              <p className="mt-2 text-2xl font-semibold">
                {paidOrders} / {pendingOrders}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase text-muted-foreground">Boletos emitidos / usados</p>
              <p className="mt-2 text-2xl font-semibold">
                {emittedTickets} / {usedTickets}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex flex-wrap gap-3">
              <Link
                href="/tickets/eventos"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
              >
                Ir a eventos publicos
              </Link>
              <Link
                href="/tickets/admin/ordenes"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
              >
                Ver ordenes y boletos
              </Link>
              <Link
                href="/tickets/admin/checkin"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
              >
                Ir a check-in QR
              </Link>
              <a
                href="/api/tickets/export/orders"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
              >
                Exportar ordenes CSV
              </a>
              <a
                href="/api/tickets/export/tickets"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
              >
                Exportar boletos CSV
              </a>
            </div>
          </div>
        </section>

        {isAdmin ? (
          <section className="mt-8 grid gap-6 xl:grid-cols-2">
            <AdminTicketEventForm />
            <AdminTicketTypeForm events={eventsForTypeForm} />
          </section>
        ) : (
          <section className="mt-8 card-next rounded-3xl p-6">
            <h2 className="text-2xl font-semibold">Modo consulta para STAFF</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tu rol puede revisar eventos y tipos de boleto, pero no puede crear o editar configuraciones.
            </p>
          </section>
        )}

        <section className="mt-8 card-next rounded-3xl p-6">
          <h2 className="text-2xl font-semibold">Eventos registrados</h2>

          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-sm text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Evento</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Lugar</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Boletos</th>
                  <th className="px-4 py-3">Accion</th>
                </tr>
              </thead>
              <tbody>
                {events.length ? (
                  events.map((event) => (
                    <tr key={event.id} className="border-t border-white/10">
                      <td className="px-4 py-3">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{event.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatTicketDate(event.eventDate)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{event.location}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
                          {event.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{event.ticketTypes.length}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/tickets/eventos/${event.id}`}
                            className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Ver publico
                          </Link>
                          <a
                            href={`/api/tickets/export/event/${event.id}`}
                            className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Exportar asistentes
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-muted-foreground">
                      Aun no existen eventos en Delta Tickets.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 card-next rounded-3xl p-6">
          <h2 className="text-2xl font-semibold">Tipos de boleto registrados</h2>

          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-sm text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Evento</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Vendidos</th>
                  <th className="px-4 py-3">Disponibles</th>
                  <th className="px-4 py-3">Activo</th>
                </tr>
              </thead>
              <tbody>
                {events.some((event) => event.ticketTypes.length > 0) ? (
                  events.flatMap((event) =>
                    event.ticketTypes.map((ticketType) => (
                      <tr key={ticketType.id} className="border-t border-white/10">
                        <td className="px-4 py-3 text-muted-foreground">{event.title}</td>
                        <td className="px-4 py-3 font-medium">{ticketType.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatTicketMoney(Number(ticketType.price))}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{ticketType.quantity}</td>
                        <td className="px-4 py-3 text-muted-foreground">{ticketType.soldCount}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {Math.max(ticketType.quantity - ticketType.soldCount, 0)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
                            {ticketType.isActive ? "SI" : "NO"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-muted-foreground">
                      Aun no hay tipos de boleto creados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Stock disponible global: {totalAvailableStock} boletos.</p>
        </section>
      </main>
      <Footer />
    </>
  );
}
