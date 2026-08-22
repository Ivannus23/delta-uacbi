import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { db } from "@/lib/db";

export const revalidate = 60;

export default async function SemanaCulturalDirectoryPage() {
  const organizations = await db.organization.findMany({
    include: {
      editions: {
        where: { isActive: true },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <Navbar />
      <main className="container py-14">
        <p className="text-sm text-muted-foreground">Semana Cultural</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Elige tu organizacion</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Cada unidad academica administra su propia Semana Cultural: equipos, actividades, ranking
          y resultados en vivo.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {organizations.length ? (
            organizations.map((org) => (
              <Link
                key={org.id}
                href={`/semana-cultural/${org.slug}`}
                className="card-next rounded-2xl p-6"
              >
                <h2 className="text-lg font-semibold">{org.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {org.editions[0] ? org.editions[0].name : "Sin edicion activa todavia"}
                </p>
                <p className="mt-4 text-xs text-muted-foreground">Entrar →</p>
              </Link>
            ))
          ) : (
            <div className="card-next rounded-2xl p-6">
              <h2 className="text-lg font-semibold">Aun no hay organizaciones</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Cuando se cree una organizacion, aparecera aqui.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
