import Link from "next/link";
import { sanityClient } from "@/lib/sanity/client";
import { jobsQuery } from "@/lib/sanity/queries";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

type Job = {
  _id: string;
  title: string;
  slug: string;
  company: string;
  location?: string;
  type?: string;
  publishedAt?: string;
};

function fmtDate(d?: string) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("es-MX");
  } catch {
    return null;
  }
}

export default async function BolsaPage() {
  const items = await sanityClient.fetch<Job[]>(jobsQuery);

  return (
    <>
      <Navbar />

      <main className="container py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Bolsa de trabajo</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Vacantes, prácticas y oportunidades para estudiantes.
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
            {items.map((j) => (
              <Link key={j._id} href={`/bolsa/${j.slug}`} className="card-next rounded-2xl p-6">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold leading-snug">{j.title}</h2>

                  {j.type ? (
                    <span className="text-xs rounded-full border border-white/10 px-2 py-1 text-muted-foreground whitespace-nowrap">
                      {j.type}
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                  {[j.company, j.location, fmtDate(j.publishedAt)].filter(Boolean).join(" · ")}
                </div>

                <p className="mt-3 text-sm text-muted-foreground">Ver detalles →</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 card-next rounded-2xl p-6">
            <h2 className="text-lg font-semibold">Aún no hay vacantes</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Cuando se publiquen vacantes desde el Studio, aparecerán aquí.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
