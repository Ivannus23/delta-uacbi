import Link from "next/link";
import { sanityClient } from "@/lib/sanity/client";
import { projectsQuery } from "@/lib/sanity/queries";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
export const revalidate = 3600;


type Project = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  area?: string;
  stack?: string[];
  publishedAt?: string;
};

export default async function ProyectosPage() {
  const items = await sanityClient.fetch<Project[]>(projectsQuery);

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Proyectos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Portafolio estudiantil y proyectos destacados.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {items.map((p) => (
            <Link key={p._id} href={`/proyectos/${p.slug}`} className="card-next rounded-2xl p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold">{p.title}</h2>
                {p.area ? (
                  <span className="text-xs rounded-full border border-white/10 px-2 py-1 text-muted-foreground">
                    {p.area}
                  </span>
                ) : null}
              </div>

              <div className="mt-2 text-xs text-muted-foreground">
                {[p.stack?.slice(0, 4).join(" · "), p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("es-MX") : null]
                  .filter(Boolean)
                  .join(" · ")}
              </div>

              {p.excerpt ? (
                <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>
              ) : null}
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
