import { auth } from "@/auth";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { LoginButton } from "@/components/auth/LoginButton";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function StaffEntryPage() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase() ?? "";

  if (email) {
    const user = await db.user.findUnique({
      where: { email },
      select: { role: true },
    });

    if (user?.role === "ADMIN" || user?.role === "STAFF") {
      redirect("/semana-cultural/admin/dashboard");
    }
  }

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana />

        <section className="card-next mx-auto max-w-3xl rounded-3xl p-6 sm:p-8">
          <div className="inline-flex rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
            Acceso staff
          </div>

          <h1 className="mt-4 text-3xl font-semibold">Entrada separada para staff y administracion</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Este acceso es solo para personal staff o administradores. Primero inicia sesion con tu
            cuenta institucional y despues asigna el rol correspondiente directamente en la base de
            datos si aun no lo tiene.
          </p>

          <div className="mt-6">
            <LoginButton
              callbackUrl="/semana-cultural/admin/dashboard"
              className="btn-sheen inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
            />
          </div>

          {session?.user ? (
            <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
              <p className="text-sm text-amber-50">
                Tu cuenta ya inicio sesion, pero aun no tiene rol de staff o admin asignado.
              </p>
            </div>
          ) : null}
        </section>
      </main>
      <Footer />
    </>
  );
}
