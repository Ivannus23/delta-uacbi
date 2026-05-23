import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { DigitalTicketView } from "@/components/tickets/DigitalTicketView";
import { getDigitalTicketByQrToken } from "@/lib/tickets/orders";

type DigitalTicketPageProps = {
  params: Promise<{ qrToken: string }>;
};

export const revalidate = 0;

export default async function DigitalTicketPage({ params }: DigitalTicketPageProps) {
  const { qrToken } = await params;

  const ticket = await getDigitalTicketByQrToken(qrToken);
  if (!ticket) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href={`/tickets/orden/${ticket.order.publicToken}`}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
          >
            Ver orden
          </Link>
          <Link
            href={`/tickets/eventos/${ticket.eventId}`}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
          >
            Ver evento
          </Link>
        </div>

        <DigitalTicketView ticket={ticket} />
      </main>
      <Footer />
    </>
  );
}
