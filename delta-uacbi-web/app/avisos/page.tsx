import Link from "next/link";
import { sanityClient } from "@/lib/sanity/client";
import { noticesQuery } from "@/lib/sanity/queries";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
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
            <h1 className="text-3xl font-semibold tracking-tight">Avisos</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Comunicados del comité y anuncios académicos.
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
            {items.map((n) => (
              <Link
                key={n._id}
                href={`/avisos/${n.slug}`}
                className="card-next rounded-2xl p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold leading-snug">{n.title}</h2>

                  {n.pinned ? (
                    <span className="text-xs rounded-full border border-white/10 px-2 py-1 text-muted-foreground whitespace-nowrap">
                      Fijado
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                  {[n.category, fmtDate(n.publishedAt)].filter(Boolean).join(" · ")}
                </div>

                {n.excerpt ? (
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                    {n.excerpt}
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
            <h2 className="text-lg font-semibold">Aún no hay avisos</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Publica un aviso desde el Studio y aparecerá aquí.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
