import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="card p-8">
        <h1 className="text-3xl font-bold">Bienvenido a Delta UACBI</h1>
        <p className="mt-2 text-neutral-700">
          Repositorio de proyectos con revisión, concursos y avisos. Multilenguaje ES/EN.
        </p>
        <div className="mt-6 flex gap-3">
          <Link className="px-4 py-2 rounded-xl border" href="/projects">Ver proyectos</Link>
          <Link className="px-4 py-2 rounded-xl border" href="/projects/new">Enviar proyecto</Link>
        </div>
      </section>
      <section className="grid md:grid-cols-3 gap-6">
        <div className="card p-6"><h3 className="font-semibold">Novedades</h3><p>Embed IG/TikTok/Facebook (pendiente)</p></div>
        <div className="card p-6"><h3 className="font-semibold">Concursos</h3><p>Próximas convocatorias</p></div>
        <div className="card p-6"><h3 className="font-semibold">Para empresas</h3><p>Explora proyectos y talento</p></div>
      </section>
    </div>
  );
}
