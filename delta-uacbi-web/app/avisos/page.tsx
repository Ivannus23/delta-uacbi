import { ArrowRight } from "lucide-react";
import { sanityClient } from "@/lib/sanity/client";
import { noticesQuery } from "@/lib/sanity/queries";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
export const revalidate = 3600;


type Notice = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
  publishedAt?: string;
  pinned?: boolean;
};

function fmtDate(d?: string) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("es-MX");
  } catch {
    return null;
  }
}

export default async function AvisosPage() {
  const items = await sanityClient.fetch<Notice[]>(noticesQuery);

  return (
    <>
      <Navbar />

      <main className="container py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <Badge variant="avisos" dot>Avisos</Badge>
            <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight">Avisos</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Comunicados del comité y anuncios académicos.
            </p>
          </div>

          <Button href="/" variant="ghost" size="sm">
            Inicio
          </Button>
        </div>

        {items?.length ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {items.map((n) => (
              <Card key={n._id} href={`/avisos/${n.slug}`} variant="surface" className="accent-avisos">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold leading-snug">{n.title}</h2>

                  {n.pinned ? <Badge variant="avisos">Fijado</Badge> : null}
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                  {[n.category, fmtDate(n.publishedAt)].filter(Boolean).join(" · ")}
                </div>

                {n.excerpt ? (
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                    {n.excerpt}
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
          <Card variant="surface" className="mt-8 accent-avisos">
            <h2 className="text-lg font-semibold">Aún no hay avisos</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Publica un aviso desde el Studio y aparecerá aquí.
            </p>
          </Card>
        )}
      </main>

      <Footer />
    </>
  );
}
