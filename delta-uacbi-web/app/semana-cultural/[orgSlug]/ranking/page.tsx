import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { getRanking, resolveOrganization, getActiveEdition } from "@/lib/semana-cultural";

export default async function RankingPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const organization = await resolveOrganization(orgSlug);
  const [teams, edition] = await Promise.all([
    getRanking(organization.id),
    getActiveEdition(organization.id),
  ]);

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana orgSlug={orgSlug} edition={edition} />

        <h1 className="text-3xl font-semibold">Ranking general</h1>
        <p className="mt-2 text-muted-foreground">Clasificación de equipos de la Semana Cultural.</p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-sm text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Posición</th>
                <th className="px-4 py-3">Equipo</th>
                <th className="px-4 py-3">Composicion</th>
                <th className="px-4 py-3">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {teams.length ? (
                teams.map((team, index) => (
                  <tr key={team.id} className="border-t border-white/10">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3 font-medium">{team.animal}</td>
                    <td className="px-4 py-3 text-muted-foreground">{team.compositionLabel}</td>
                    <td className="px-4 py-3 font-semibold">{team.totalPoints}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-muted-foreground">
                    Aún no hay equipos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </>
  );
}
