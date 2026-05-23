import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export default function TicketOrderNotFoundPage() {
  return (
    <>
      <Navbar />
      <main className="container py-10">
        <section className="card-next rounded-3xl p-8">
          <h1 className="text-3xl font-semibold">Orden no encontrada.</h1>
          <p className="mt-3 text-muted-foreground">
            Verifica el enlace compartido o genera una nueva orden desde el evento correspondiente.
          </p>
          <div className="mt-6">
            <Link
              href="/tickets/eventos"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              Ver eventos
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
