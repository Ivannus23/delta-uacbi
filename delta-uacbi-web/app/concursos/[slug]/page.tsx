import Link from "next/link";
import { notFound } from "next/navigation";
import { sanityClient } from "@/lib/sanity/client";
import { contestBySlugQuery } from "@/lib/sanity/queries";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RichText } from "@/components/RichText";
import Image from "next/image";
import { urlFor } from "@/lib/sanity/image";
export const revalidate = 3600;


function formatDate(d?: string) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("es-MX");
  } catch {
    return null;
  }
}

export default async function ConcursoDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) return notFound();

  const c = await sanityClient.fetch(contestBySlugQuery, { slug });
  if (!c) return notFound();

  const deadline = formatDate(c.deadline);
  const meta = [c.status, deadline ? `Límite: ${deadline}` : null].filter(Boolean).join(" · ");

  const coverUrl = c.coverImage ? urlFor(c.coverImage).width(1600).height(900).url() : null;

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <Link href="/concursos" className="text-sm text-muted-foreground hover:underline">
          ← Volver a concursos
        </Link>

        <h1 className="mt-5 text-3xl font-semibold tracking-tight">{c.title}</h1>
        {meta ? <div className="mt-2 text-sm text-muted-foreground">{meta}</div> : null}
        {c.excerpt ? <p className="mt-4 text-muted-foreground">{c.excerpt}</p> : null}

        {coverUrl ? (
          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <Image src={coverUrl} alt={c.title} width={1600} height={900} className="h-auto w-full" />
          </div>
        ) : null}

        <article className="mt-8 card-next rounded-2xl p-6">
          <RichText value={c.body} />
        </article>
      </main>
      <Footer />
    </>
  );
}
