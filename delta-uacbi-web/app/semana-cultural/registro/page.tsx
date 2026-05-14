import { auth } from "@/auth";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { LoginButton } from "@/components/auth/LoginButton";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { RegistroTeamForm } from "@/components/semana-cultural/RegistroTeamForm";
import { db } from "@/lib/db";
import { SEMANA_CULTURAL_ANIMALES } from "@/lib/semana-cultural-config";
import { getActiveEdition } from "@/lib/semana-cultural";
import { redirect } from "next/navigation";

export default async function RegistroPage() {
  const session = await auth();
  const user = session?.user;
  const edition = await getActiveEdition();

  const registeredTeams = edition
    ? await db.team.findMany({
        where: {
          editionId: edition.id,
        },
        select: {
          animal: true,
        },
      })
    : [];

  const usedAnimales = new Set(registeredTeams.map((team) => team.animal));
  const availableAnimales = SEMANA_CULTURAL_ANIMALES.filter((animal) => !usedAnimales.has(animal));
  const noAnimalesAvailable = Boolean(edition) && availableAnimales.length === 0;
  const canRegisterTeam = Boolean(edition) && availableAnimales.length > 0;

  const userId =
    user && typeof user === "object" && "id" in user && typeof user.id === "string"
      ? user.id
      : null;

  if (edition && userId) {
    const existingTeam = await db.team.findFirst({
      where: {
        editionId: edition.id,
        leaderId: userId,
      },
      select: {
        id: true,
      },
    });

    if (existingTeam) {
      redirect(`/semana-cultural/equipos/${existingTeam.id}`);
    }
  }

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana />

        <h1 className="text-3xl font-semibold">Registro de equipos</h1>
        <p className="mt-2 text-muted-foreground">
          El jefe de grupo primero inicia sesion con Google y despues completa los datos del equipo
          y del encargado.
        </p>

        {!user ? (
          <section className="card-next mt-8 max-w-3xl rounded-3xl p-6 sm:p-8">
            <div className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
              Paso 1 de 2
            </div>
            <h2 className="mt-4 text-2xl font-semibold">Inicia sesion con tu cuenta institucional</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Usaremos tu cuenta de Google para identificar al jefe de grupo, vincular el equipo a
              su perfil y despues pedir solo los datos adicionales del registro.
            </p>

            <div className="mt-6">
              <LoginButton
                callbackUrl="/semana-cultural/registro"
                className="btn-sheen inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
              />
            </div>
          </section>
        ) : (
          <RegistroTeamForm
            userName={user.name ?? ""}
            userEmail={user.email ?? ""}
            availableAnimales={availableAnimales}
            noAnimalesAvailable={noAnimalesAvailable}
            canRegisterTeam={canRegisterTeam}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
