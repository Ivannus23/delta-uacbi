import Link from "next/link";
import { notFound } from "next/navigation";
import { sanityClient } from "@/lib/sanity/client";
import { projectBySlugQuery } from "@/lib/sanity/queries";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RichText } from "@/components/RichText";
import Image from "next/image";
import { urlFor } from "@/lib/sanity/image";
export const revalidate = 3600;


export default async function ProyectoDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) return notFound();

  const p = await sanityClient.fetch(projectBySlugQuery, { slug });
  if (!p) return notFound();

  const coverUrl = p.coverImage ? urlFor(p.coverImage).width(1600).height(900).url() : null;

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <Link href="/proyectos" className="text-sm text-muted-foreground hover:underline">
          ← Volver a proyectos
        </Link>

        <h1 className="mt-5 text-3xl font-semibold tracking-tight">{p.title}</h1>
        <div className="mt-2 text-sm text-muted-foreground">
          {[p.area, p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("es-MX") : null]
            .filter(Boolean)
            .join(" · ")}
        </div>

        {p.stack?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {p.stack.map((t: string) => (
              <span key={t} className="text-xs rounded-full border border-white/10 px-2 py-1 text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        ) : null}

        {p.repoUrl ? (
          <a
            className="mt-5 inline-block btn-sheen rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            href={p.repoUrl}
            target="_blank"
            rel="noreferrer"
          >
            Ver link / repo
          </a>
        ) : null}

        {/* Imagen portada */}
        {coverUrl ? (
          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <Image src={coverUrl} alt={p.title} width={1600} height={900} className="h-auto w-full" />
          </div>
        ) : null}

        <article className="mt-8 card-next rounded-2xl p-6">
          <RichText value={p.body} />
        </article>
      </main>
      <Footer />
    </>
  );
}
