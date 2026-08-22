import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default async function OrganizacionSuspendidaPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const { org } = await searchParams;

  return (
    <>
      <Navbar />
      <main className="container py-16">
        <section className="card-next mx-auto max-w-xl rounded-3xl p-8 text-center">
          <h1 className="text-2xl font-semibold">Organización sin suscripción activa</h1>
          <p className="mt-4 text-muted-foreground">
            {org ? (
              <>
                La organización <strong>{org}</strong> no tiene una suscripción activa en este
                momento.
              </>
            ) : (
              "Esta organización no tiene una suscripción activa en este momento."
            )}{" "}
            Contacta al administrador de la plataforma para más información.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
