import { auth } from "@/auth";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { LoginButton } from "@/components/auth/LoginButton";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { RegistroTeamForm } from "@/components/semana-cultural/RegistroTeamForm";
import { db } from "@/lib/db";
import { resolveOrganization, getActiveEdition } from "@/lib/semana-cultural";
import { getTeamNameOptions } from "@/lib/semana-cultural-catalog";
import { ACADEMIC_UNITS } from "@/lib/academic-catalog";
import { redirect } from "next/navigation";
import { createTeamWithState } from "./actions";

export default async function RegistroPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const organization = await resolveOrganization(orgSlug);

  const session = await auth();
  const user = session?.user;
  const edition = await getActiveEdition(organization.id);

  const [registeredTeams, teamNameOptions] = edition
    ? await Promise.all([
        db.team.findMany({ where: { editionId: edition.id }, select: { animal: true } }),
        getTeamNameOptions(edition.id),
      ])
    : [[], []];

  const usedAnimales = new Set(registeredTeams.map((team) => team.animal));
  const availableAnimales = teamNameOptions
    .map((option) => option.name)
    .filter((name) => !usedAnimales.has(name));
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
      redirect(`/semana-cultural/${orgSlug}/equipos/${existingTeam.id}`);
    }
  }

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana orgSlug={orgSlug} edition={edition} />

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
                callbackUrl={`/semana-cultural/${orgSlug}/registro`}
                className="btn-sheen inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
              />
            </div>
          </section>
        ) : (
          <RegistroTeamForm
            orgSlug={orgSlug}
            userName={user.name ?? ""}
            userEmail={user.email ?? ""}
            availableAnimales={availableAnimales}
            noAnimalesAvailable={noAnimalesAvailable}
            canRegisterTeam={canRegisterTeam}
            academicUnits={ACADEMIC_UNITS}
            action={createTeamWithState.bind(null, organization.id, orgSlug)}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
