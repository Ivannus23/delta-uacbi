import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { TicketCheckinScanner } from "@/components/tickets/TicketCheckinScanner";
import { getSessionUserInfo, requireStaff } from "@/lib/auth";

export const revalidate = 0;

export default async function TicketAdminCheckinPage() {
  const session = await requireStaff();
  const { role } = getSessionUserInfo(session.user);

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <section className="card-next rounded-3xl p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Delta Tickets Admin</p>
          <h1 className="mt-2 text-3xl font-semibold">Check-in de acceso</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            STAFF y ADMIN pueden validar entradas por QR y marcar boletos como usados.
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
          </div>
        </section>

        <section className="mt-8">
          <TicketCheckinScanner />
        </section>
      </main>
      <Footer />
    </>
  );
}
