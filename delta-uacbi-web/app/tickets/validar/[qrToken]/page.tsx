import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { getTicketValidationByQrToken } from "@/lib/tickets/checkin";

type TicketValidationPageProps = {
  params: Promise<{ qrToken: string }>;
};

function getStatusClasses(status: string) {
  if (status === "VALID") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
  }
  if (status === "USED") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  }
  return "border-rose-500/40 bg-rose-500/10 text-rose-200";
}

export const revalidate = 0;

export default async function TicketValidationPage({ params }: TicketValidationPageProps) {
  const { qrToken } = await params;
  const validation = await getTicketValidationByQrToken(qrToken);

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <section className={`rounded-3xl border p-8 ${getStatusClasses(validation.status)}`}>
          <p className="text-xs uppercase tracking-[0.2em]">Delta Tickets</p>
          <h1 className="mt-2 text-3xl font-semibold">Validacion de boleto</h1>
          <p className="mt-3 text-base">{validation.message}</p>

          {validation.ticket ? (
            <div className="mt-5 grid gap-2 text-sm">
              <p>Folio: {validation.ticket.folio}</p>
              <p>Evento: {validation.ticket.eventTitle}</p>
              <p>Tipo: {validation.ticket.ticketTypeName}</p>
              <p>Comprador: {validation.ticket.buyerName}</p>
              <p>
                Estado de uso:{" "}
                {validation.status === "USED"
                  ? validation.ticket.usedAt
                    ? `Usado el ${new Date(validation.ticket.usedAt).toLocaleString("es-MX")}`
                    : "Ya utilizado"
                  : validation.status === "VALID"
                    ? "Vigente"
                    : "No valido"}
              </p>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/tickets/eventos"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-current hover:bg-white/10"
            >
              Ver eventos
            </Link>
            <Link
              href="/tickets"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-current hover:bg-white/10"
            >
              Inicio Delta Tickets
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
