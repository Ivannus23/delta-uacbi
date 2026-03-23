import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveEdition } from "@/lib/semana-cultural";

export const revalidate = 3600;

const adminLinks = [
  { href: "/semana-cultural/admin/equipos", label: "Equipos", description: "Revisar y aprobar equipos" },
  { href: "/semana-cultural/admin/actividades", label: "Actividades", description: "Crear actividades e inscripciones" },
  { href: "/semana-cultural/admin/puntos", label: "Puntos", description: "Asignar resultados y movimientos" },
  { href: "/semana-cultural/admin/auditoria", label: "Auditoria", description: "Consultar la bitacora del sistema" },
];

const adminOnlyLinks = [
  { href: "/semana-cultural/admin/usuarios", label: "Usuarios", description: "Administrar roles y accesos" },
];

export default async function DashboardSemanaPage() {
  const session = await requireStaff();
  const role = (session.user as any).role;
  const visibleLinks = role === "ADMIN" ? [...adminLinks, ...adminOnlyLinks] : adminLinks;

  const edition = await getActiveEdition();

  const [
    totalTeams,
    approvedTeams,
    totalMembers,
    totalEvents,
    totalRegistrations,
    totalScoreLogs,
    topTeams,
  ] = edition
    ? await Promise.all([
        db.team.count({ where: { editionId: edition.id } }),
        db.team.count({ where: { editionId: edition.id, status: "APROBADO" } }),
        db.member.count({
          where: {
            team: { editionId: edition.id },
          },
        }),
        db.event.count({ where: { editionId: edition.id } }),
        db.eventRegistration.count({
          where: {
            event: { editionId: edition.id },
          },
        }),
        db.scoreLog.count({ where: { editionId: edition.id } }),
        db.team.findMany({
          where: { editionId: edition.id },
          orderBy: [{ totalPoints: "desc" }, { name: "asc" }],
          take: 5,
        }),
      ])
    : [0, 0, 0, 0, 0, 0, []];

  const cards = [
    { label: "Equipos registrados", value: totalTeams },
    { label: "Equipos aprobados", value: approvedTeams },
    { label: "Integrantes capturados", value: totalMembers },
    { label: "Actividades", value: totalEvents },
    { label: "Inscripciones", value: totalRegistrations },
    { label: "Movimientos de puntos", value: totalScoreLogs },
  ];

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana />

        <section className="card-next rounded-3xl p-6">
          <h2 className="text-3xl font-semibold">Panel staff</h2>
          <p className="mt-2 text-muted-foreground">
            Desde aqui se concentra toda la operacion administrativa del modulo.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
              >
                <h3 className="text-lg font-semibold">{item.label}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className="card-next rounded-3xl p-6">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight">{card.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 card-next rounded-3xl p-6">
          <h2 className="text-2xl font-semibold">Top 5 equipos</h2>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-sm text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Posicion</th>
                  <th className="px-4 py-3">Equipo</th>
                  <th className="px-4 py-3">Unidad</th>
                  <th className="px-4 py-3">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {topTeams.length ? (
                  topTeams.map((team, index) => (
                    <tr key={team.id} className="border-t border-white/10">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3 font-medium">{team.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{team.unidadAcademica}</td>
                      <td className="px-4 py-3 font-semibold">{team.totalPoints}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-muted-foreground">
                      Aun no hay equipos en el ranking.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
