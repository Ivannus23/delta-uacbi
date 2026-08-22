import { ArrowRight } from "lucide-react";
import { sanityClient } from "@/lib/sanity/client";
import { homeQuery } from "@/lib/sanity/queries";
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
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <Button href={href} variant="ghost" size="sm" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
        Ver todo
      </Button>
    </div>
  );
}

function EmptyCard({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <Card href={href} variant="item">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      <p className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
        Ir <ArrowRight className="h-3 w-3" />
      </p>
    </Card>
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
          <Badge variant="tickets" dot>
            Comité académico · UACBI
          </Badge>

          <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Delta UACBI
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Avisos, proyectos, concursos y oportunidades para estudiantes. Un escaparate serio para
            que las empresas vean lo que hacemos.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button href="/proyectos" variant="primary" size="lg">
              Ver proyectos
            </Button>
            <Button href="/bolsa" variant="outline" size="lg">
              Bolsa de trabajo
            </Button>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {(
              [
                ["Enfoque", "Académico primero", "border-t-avisos"],
                ["Para", "Estudiantes y empresas", "border-t-proyectos"],
                ["Stack", "Comunidad UACBI", "border-t-bolsa"],
              ] as const
            ).map(([k, v, accentClass]) => (
              <div
                key={k}
                className={`rounded-2xl border border-white/10 border-t-2 ${accentClass} bg-white/5 p-4`}
              >
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
                  <Card key={n._id} href={`/avisos/${n.slug}`} variant="item">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium leading-snug">{n.title}</p>
                      {n.pinned ? <Badge variant="avisos">Fijado</Badge> : null}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {[n.category, fmtDate(n.publishedAt)].filter(Boolean).join(" · ")}
                    </div>
                    {n.excerpt ? (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{n.excerpt}</p>
                    ) : null}
                  </Card>
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
                  <Card key={p._id} href={`/proyectos/${p.slug}`} variant="item">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium leading-snug">{p.title}</p>
                      {p.area ? <Badge variant="proyectos">{p.area}</Badge> : null}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {[p.stack?.slice(0, 4).join(" · "), fmtDate(p.publishedAt)]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                    {p.excerpt ? (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
                    ) : null}
                  </Card>
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
                  <Card key={c._id} href={`/concursos/${c.slug}`} variant="item">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium leading-snug">{c.title}</p>
                      {c.status ? <Badge variant="concursos">{c.status}</Badge> : null}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {c.deadline ? `Límite: ${fmtDate(c.deadline)}` : "Sin fecha límite"}
                    </div>
                    {c.excerpt ? (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.excerpt}</p>
                    ) : null}
                  </Card>
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
                  <Card key={j._id} href={`/bolsa/${j.slug}`} variant="item">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium leading-snug">{j.title}</p>
                      {j.type ? <Badge variant="bolsa">{j.type}</Badge> : null}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {[j.company, j.location, fmtDate(j.publishedAt)].filter(Boolean).join(" · ")}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {j.location ? `Ubicación: ${j.location}` : "Ver detalles"}
                    </p>
                  </Card>
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
