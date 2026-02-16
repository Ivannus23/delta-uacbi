import Link from "next/link";
import { sanityClient } from "@/lib/sanity/client";
import { contestsQuery } from "@/lib/sanity/queries";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

type Contest = {
  _id: string;
  title: string;
  slug: string;
  status?: string;
  deadline?: string;
  excerpt?: string;
};

function fmtDate(d?: string) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("es-MX");
  } catch {
    return null;
  }
}

export default async function ConcursosPage() {
  const items = await sanityClient.fetch<Contest[]>(contestsQuery);

  return (
    <>
      <Navbar />

      <main className="container py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Concursos</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Convocatorias abiertas, próximas y archivo.
            </p>
          </div>

          <Link
            href="/"
            className="btn-sheen rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
          >
            Inicio
          </Link>
        </div>

        {items?.length ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {items.map((c) => (
              <Link
                key={c._id}
                href={`/concursos/${c.slug}`}
                className="card-next rounded-2xl p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold leading-snug">{c.title}</h2>

                  {c.status ? (
                    <span className="text-xs rounded-full border border-white/10 px-2 py-1 text-muted-foreground whitespace-nowrap">
                      {c.status}
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                  {c.deadline ? `Límite: ${fmtDate(c.deadline)}` : "Sin fecha límite"}
                </div>

                {c.excerpt ? (
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                    {c.excerpt}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Ver detalles →
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 card-next rounded-2xl p-6">
            <h2 className="text-lg font-semibold">Aún no hay concursos</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Publica una convocatoria desde el Studio y aparecerá aquí.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
