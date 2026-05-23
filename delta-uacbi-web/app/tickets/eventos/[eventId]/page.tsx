import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { TicketPurchaseForm } from "@/components/tickets/TicketPurchaseForm";
import { formatTicketDate, formatTicketMoney } from "@/lib/tickets/format";
import { getPaymentDisabledMessage, getTicketPaymentMode, isAnyTicketPaymentEnabled } from "@/lib/tickets/config";
import { getPublicTicketEventById } from "@/lib/tickets/queries";

type TicketEventDetailPageProps = {
  params: Promise<{ eventId: string }>;
};

export const revalidate = 60;

export default async function TicketEventDetailPage({ params }: TicketEventDetailPageProps) {
  const { eventId } = await params;
  const event = await getPublicTicketEventById(eventId);
  const paymentMode = getTicketPaymentMode();
  const paymentAvailable = isAnyTicketPaymentEnabled();
  const paymentUnavailableMessage = paymentAvailable ? null : getPaymentDisabledMessage();

  if (!event) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <section className="card-next rounded-3xl p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Detalle del evento</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">{event.title}</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">{event.description || "Sin descripcion disponible."}</p>

          <div className="mt-6 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
            <p>
              <span className="font-semibold text-foreground">Fecha:</span> {formatTicketDate(event.eventDate)}
            </p>
            <p>
              <span className="font-semibold text-foreground">Lugar:</span> {event.location}
            </p>
            <p>
              <span className="font-semibold text-foreground">Estado:</span> {event.status}
            </p>
            <p>
              <span className="font-semibold text-foreground">Slug:</span> {event.slug}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/tickets/eventos"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              Ver mas eventos
            </Link>
            <Link
              href="/tickets"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              Volver a inicio
            </Link>
          </div>
        </section>

        <section className="mt-8 card-next rounded-3xl p-6">
          <h2 className="text-2xl font-semibold">Tipos de boleto activos</h2>
          <p className="mt-2 text-sm text-muted-foreground">Selecciona cantidades para generar tu orden.</p>

          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-sm text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Descripcion</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Disponibles</th>
                  <th className="px-4 py-3">Maximo por orden</th>
                </tr>
              </thead>
              <tbody>
                {event.ticketTypes.length ? (
                  event.ticketTypes.map((ticketType) => {
                    const available = Math.max(ticketType.quantity - ticketType.soldCount, 0);
                    return (
                      <tr key={ticketType.id} className="border-t border-white/10">
                        <td className="px-4 py-3 font-medium">{ticketType.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{ticketType.description || "-"}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatTicketMoney(Number(ticketType.price))}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{available}</td>
                        <td className="px-4 py-3 text-muted-foreground">{ticketType.maxPerOrder}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-muted-foreground">
                      Este evento aun no tiene tipos de boleto activos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8">
          <TicketPurchaseForm
            eventId={event.id}
            eventTitle={event.title}
            ticketTypes={event.ticketTypes}
            paymentMode={paymentMode}
            paymentAvailable={paymentAvailable}
            paymentUnavailableMessage={paymentUnavailableMessage}
          />
        </section>
      </main>
      <Footer />
    </>
  );
}
