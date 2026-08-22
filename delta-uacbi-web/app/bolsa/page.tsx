import { ArrowRight } from "lucide-react";
import { sanityClient } from "@/lib/sanity/client";
import { jobsQuery } from "@/lib/sanity/queries";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
export const revalidate = 3600;


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
            <Badge variant="bolsa" dot>Bolsa de trabajo</Badge>
            <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight">Bolsa de trabajo</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Vacantess, prácticas y oportunidades para estudiantes.
            </p>
          </div>

          <Button href="/" variant="ghost" size="sm">
            Inicio
          </Button>
        </div>

        {items?.length ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {items.map((j) => (
              <Card key={j._id} href={`/bolsa/${j.slug}`} variant="surface" className="accent-bolsa">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold leading-snug">{j.title}</h2>

                  {j.type ? <Badge variant="bolsa">{j.type}</Badge> : null}
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                  {[j.company, j.location, fmtDate(j.publishedAt)].filter(Boolean).join(" · ")}
                </div>

                <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                  Ver detalles <ArrowRight className="h-3.5 w-3.5" />
                </p>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="surface" className="mt-8 accent-bolsa">
            <h2 className="text-lg font-semibold">Aún no hay vacantes</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Cuando se publiquen vacantes desde el Studio, aparecerán aquí.
            </p>
          </Card>
        )}
      </main>

      <Footer />
    </>
  );
}
