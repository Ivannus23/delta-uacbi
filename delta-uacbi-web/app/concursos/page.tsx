import { ArrowRight } from "lucide-react";
import { sanityClient } from "@/lib/sanity/client";
import { contestsQuery } from "@/lib/sanity/queries";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
export const revalidate = 3600;


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
            <Badge variant="concursos" dot>Concursos</Badge>
            <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight">Concursos</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Convocatorias abiertas, próximas y archivo.
            </p>
          </div>

          <Button href="/" variant="ghost" size="sm">
            Inicio
          </Button>
        </div>

        {items?.length ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {items.map((c) => (
              <Card key={c._id} href={`/concursos/${c.slug}`} variant="surface" className="accent-concursos">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold leading-snug">{c.title}</h2>

                  {c.status ? <Badge variant="concursos">{c.status}</Badge> : null}
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                  {c.deadline ? `Límite: ${fmtDate(c.deadline)}` : "Sin fecha límite"}
                </div>

                {c.excerpt ? (
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                    {c.excerpt}
                  </p>
                ) : (
                  <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                    Ver detalles <ArrowRight className="h-3.5 w-3.5" />
                  </p>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="surface" className="mt-8 accent-concursos">
            <h2 className="text-lg font-semibold">Aún no hay concursos</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Publica una convocatoria desde el Studio y aparecerá aquí.
            </p>
          </Card>
        )}
      </main>

      <Footer />
    </>
  );
}
