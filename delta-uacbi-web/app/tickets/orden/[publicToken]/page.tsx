import Link from "next/link";
import { notFound } from "next/navigation";
import { TicketOrderStatus } from "@prisma/client";
import { Footer } from "@/components/Footer";
import { TicketMercadoPagoButton } from "@/components/tickets/TicketMercadoPagoButton";
import { Navbar } from "@/components/Navbar";
import { TicketOrderSummary } from "@/components/tickets/TicketOrderSummary";
import { TicketSimulatedPaymentButton } from "@/components/tickets/TicketSimulatedPaymentButton";
import { getPaymentDisabledMessage, getTicketPaymentMode } from "@/lib/tickets/config";
import { getTicketOrderByPublicToken } from "@/lib/tickets/orders";

type TicketOrderPageProps = {
  params: Promise<{ publicToken: string }>;
  searchParams?: Promise<{ paymentError?: string }>;
};

export const revalidate = 0;

export default async function TicketOrderPage({ params, searchParams }: TicketOrderPageProps) {
  const { publicToken } = await params;
  const query = searchParams ? await searchParams : {};
  const order = await getTicketOrderByPublicToken(publicToken);

  if (!order) {
    notFound();
  }

  const paymentMode = getTicketPaymentMode();
  const paymentDisabledMessage = getPaymentDisabledMessage();
  const checkoutError = typeof query.paymentError === "string" ? query.paymentError.trim() : "";

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href={`/tickets/eventos/${order.eventId}`}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
          >
            Volver al evento
          </Link>
          <Link
            href="/tickets/eventos"
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
          >
            Ver eventos
          </Link>
        </div>

        <TicketOrderSummary order={order} />
        {checkoutError ? <p className="mt-4 text-sm text-rose-300">{checkoutError}</p> : null}

        {order.status === TicketOrderStatus.PENDING ? (
          <section className="mt-8">
            {paymentMode === "SIMULATED" ? (
              <TicketSimulatedPaymentButton publicToken={order.publicToken} enabled disabledMessage={null} />
            ) : paymentMode === "MERCADOPAGO" ? (
              <TicketMercadoPagoButton publicToken={order.publicToken} disabled={false} disabledMessage={null} />
            ) : (
              <TicketMercadoPagoButton
                publicToken={order.publicToken}
                disabled
                disabledMessage={paymentDisabledMessage}
              />
            )}
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  );
}
