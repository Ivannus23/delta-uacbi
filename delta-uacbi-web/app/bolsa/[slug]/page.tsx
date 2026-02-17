import Link from "next/link";
import { notFound } from "next/navigation";
import { sanityClient } from "@/lib/sanity/client";
import { jobBySlugQuery } from "@/lib/sanity/queries";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RichText } from "@/components/RichText";
export const revalidate = 3600;


function formatDate(d?: string) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("es-MX");
  } catch {
    return null;
  }
}

export default async function JobDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) return notFound();

  const j = await sanityClient.fetch(jobBySlugQuery, { slug });
  if (!j) return notFound();

  const date = formatDate(j.publishedAt);
  const meta = [j.company, j.location, j.type, date].filter(Boolean).join(" · ");

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <Link href="/bolsa" className="text-sm text-muted-foreground hover:underline">
          ← Volver a bolsa
        </Link>

        <h1 className="mt-5 text-3xl font-semibold tracking-tight">{j.title}</h1>
        {meta ? <div className="mt-2 text-sm text-muted-foreground">{meta}</div> : null}

        {j.applyUrl ? (
          <a
            className="mt-5 inline-block btn-sheen rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            href={j.applyUrl}
            target="_blank"
            rel="noreferrer"
          >
            Postularme
          </a>
        ) : null}

        <article className="mt-8 card-next rounded-2xl p-6">
          <RichText value={j.body} />
        </article>
      </main>
      <Footer />
    </>
  );
}
