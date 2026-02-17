import Link from "next/link";
import { sanityClient } from "@/lib/sanity/client";
import { homeQuery } from "@/lib/sanity/queries";
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

type Project = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  area?: string;
  stack?: string[];
  publishedAt?: string;
};

type Contest = {
  _id: string;
  title: string;
  slug: string;
  status?: string;
  deadline?: string;
  excerpt?: string;
};

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

function SectionHeader({
  title,
  href,
  subtitle,
}: {
  title: string;
  href: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <Link
        href={href}
        className="btn-sheen rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
      >
        Ver todo
      </Link>
    </div>
  );
}

function EmptyCard({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <Link href={href} className="card-next rounded-2xl p-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      <p className="mt-4 text-xs text-muted-foreground">Ir →</p>
    </Link>
  );
}

export default async function HomePage() {
  const data = await sanityClient.fetch<{
    notices: Notice[];
    projects: Project[];
    contests: Contest[];
    jobs: Job[];
  }>(homeQuery);

  const notices = data?.notices ?? [];
  const projects = data?.projects ?? [];
  const contests = data?.contests ?? [];
  const jobs = data?.jobs ?? [];

  return (
    <>
      <Navbar />

      <main className="container py-14">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/20 p-8 sm:p-12">
          <p className="text-sm text-muted-foreground">Comité académico · UACBI</p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Delta UACBI
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Avisos, proyectos, concursos y oportunidades para estudiantes. Un escaparate serio para
            que las empresas vean lo que hacemos.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/proyectos"
              className="btn-sheen rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Ver proyectos
            </Link>
            <Link
              href="/bolsa"
              className="btn-sheen rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Bolsa de trabajo
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["Enfoque", "Académico primero"],
              ["Para", "Estudiantes y empresas"],
              ["Stack", "Next.js + Sanity"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className="mt-1 font-medium">{v}</p>
              </div>
            ))}
          </div>
        </section>

        {/* GRID HOME */}
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* AVISOS */}
          <div className="card-next rounded-3xl p-6">
            <SectionHeader
              title="Avisos"
              href="/avisos"
              subtitle="Comunicados recientes y avisos académicos."
            />

            <div className="mt-5 grid gap-3">
              {notices.length ? (
                notices.map((n) => (
                  <Link
                    key={n._id}
                    href={`/avisos/${n.slug}`}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium leading-snug">{n.title}</p>
                      {n.pinned ? (
                        <span className="text-xs rounded-full border border-white/10 px-2 py-1 text-muted-foreground">
                          Fijado
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {[n.category, fmtDate(n.publishedAt)].filter(Boolean).join(" · ")}
                    </div>
                    {n.excerpt ? (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{n.excerpt}</p>
                    ) : null}
                  </Link>
                ))
              ) : (
                <EmptyCard
                  title="Aún no hay avisos"
                  desc="Cuando el comité publique avisos, aparecerán aquí."
                  href="/avisos"
                />
              )}
            </div>
          </div>

          {/* PROYECTOS */}
          <div className="card-next rounded-3xl p-6">
            <SectionHeader
              title="Proyectos"
              href="/proyectos"
              subtitle="Lo que estamos construyendo en la unidad."
            />

            <div className="mt-5 grid gap-3">
              {projects.length ? (
                projects.map((p) => (
                  <Link
                    key={p._id}
                    href={`/proyectos/${p.slug}`}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium leading-snug">{p.title}</p>
                      {p.area ? (
                        <span className="text-xs rounded-full border border-white/10 px-2 py-1 text-muted-foreground">
                          {p.area}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {[p.stack?.slice(0, 4).join(" · "), fmtDate(p.publishedAt)]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                    {p.excerpt ? (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
                    ) : null}
                  </Link>
                ))
              ) : (
                <EmptyCard
                  title="Aún no hay proyectos"
                  desc="Publica proyectos desde el Studio y se verán aquí."
                  href="/proyectos"
                />
              )}
            </div>
          </div>

          {/* CONCURSOS */}
          <div className="card-next rounded-3xl p-6">
            <SectionHeader
              title="Concursos"
              href="/concursos"
              subtitle="Convocatorias activas y próximas."
            />

            <div className="mt-5 grid gap-3">
              {contests.length ? (
                contests.map((c) => (
                  <Link
                    key={c._id}
                    href={`/concursos/${c.slug}`}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium leading-snug">{c.title}</p>
                      {c.status ? (
                        <span className="text-xs rounded-full border border-white/10 px-2 py-1 text-muted-foreground">
                          {c.status}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {c.deadline ? `Límite: ${fmtDate(c.deadline)}` : "Sin fecha límite"}
                    </div>
                    {c.excerpt ? (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.excerpt}</p>
                    ) : null}
                  </Link>
                ))
              ) : (
                <EmptyCard
                  title="Aún no hay concursos"
                  desc="Agrega convocatorias desde el Studio."
                  href="/concursos"
                />
              )}
            </div>
          </div>

          {/* BOLSA */}
          <div className="card-next rounded-3xl p-6">
            <SectionHeader
              title="Bolsa de trabajo"
              href="/bolsa"
              subtitle="Vacantes, prácticas y oportunidades."
            />

            <div className="mt-5 grid gap-3">
              {jobs.length ? (
                jobs.map((j) => (
                  <Link
                    key={j._id}
                    href={`/bolsa/${j.slug}`}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium leading-snug">{j.title}</p>
                      {j.type ? (
                        <span className="text-xs rounded-full border border-white/10 px-2 py-1 text-muted-foreground">
                          {j.type}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {[j.company, j.location, fmtDate(j.publishedAt)].filter(Boolean).join(" · ")}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {j.location ? `Ubicación: ${j.location}` : "Ver detalles"}
                    </p>
                  </Link>
                ))
              ) : (
                <EmptyCard
                  title="Aún no hay vacantes"
                  desc="Cuando se publiquen vacantes, aparecerán aquí."
                  href="/bolsa"
                />
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
