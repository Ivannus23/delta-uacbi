import Link from "next/link";
import { notFound } from "next/navigation";
import { sanityClient } from "@/lib/sanity/client";
import { noticeBySlugQuery } from "@/lib/sanity/queries";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RichText } from "@/components/RichText";
export const revalidate = 3600;


export default async function AvisoDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) return notFound();

  const post = await sanityClient.fetch(noticeBySlugQuery, { slug });
  if (!post) return notFound();

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <Link href="/avisos" className="text-sm text-muted-foreground hover:underline">
          ← Volver a avisos
        </Link>

        <h1 className="mt-5 text-3xl font-semibold tracking-tight">{post.title}</h1>
        <div className="mt-2 text-sm text-muted-foreground">
          {[post.category, post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("es-MX") : null]
            .filter(Boolean)
            .join(" · ")}
        </div>

        <article className="mt-8 card-next rounded-2xl p-6">
          <RichText value={post.body} />
        </article>
      </main>
      <Footer />
    </>
  );
}
