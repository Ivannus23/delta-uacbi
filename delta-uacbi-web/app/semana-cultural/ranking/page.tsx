import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { getRanking } from "@/lib/semana-cultural";

export default async function RankingPage() {
  const teams = await getRanking();

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana />

        <h1 className="text-3xl font-semibold">Ranking general</h1>
        <p className="mt-2 text-muted-foreground">
          Clasificación de equipos de la Semana Cultural.
        </p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-sm text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Posición</th>
                <th className="px-4 py-3">Equipo</th>
                <th className="px-4 py-3">Unidad</th>
                <th className="px-4 py-3">Animal</th>
                <th className="px-4 py-3">Color</th>
                <th className="px-4 py-3">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {teams.length ? (
                teams.map((team, index) => (
                  <tr key={team.id} className="border-t border-white/10">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3 font-medium">{team.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{team.unidadAcademica}</td>
                    <td className="px-4 py-3 text-muted-foreground">{team.animal}</td>
                    <td className="px-4 py-3 text-muted-foreground">{team.color}</td>
                    <td className="px-4 py-3 font-semibold">{team.totalPoints}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-muted-foreground">
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
