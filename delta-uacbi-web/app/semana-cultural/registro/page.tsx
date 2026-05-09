import { auth } from "@/auth";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { LoginButton } from "@/components/auth/LoginButton";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { RegistroUnidadProgramaField } from "@/components/semana-cultural/RegistroUnidadProgramaField";
import { SuggestionSelect } from "@/components/semana-cultural/SuggestionSelect";
import { db } from "@/lib/db";
import { SEMANA_CULTURAL_ANIMALES } from "@/lib/semana-cultural-config";
import { getActiveEdition } from "@/lib/semana-cultural";
import { redirect } from "next/navigation";
import { createTeam } from "./actions";

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
          <form action={createTeam} className="mt-8 card-next rounded-3xl p-6">
            <div className="mb-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                Paso 2 de 2
              </p>
              <p className="mt-2 text-sm text-emerald-50">
                Vas a registrar como responsable a <strong>{user.name}</strong> con el correo{" "}
                <strong>{user.email}</strong>.
              </p>
              <p className="mt-2 text-sm text-emerald-100/90">
                El encargado tambien cuenta como participante inicial del equipo (1/50).
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <RegistroUnidadProgramaField
                unidadName="responsableAcademicUnit"
                programName="responsableAcademicProgram"
                unidadLabel="Unidad academica del responsable"
                programLabel="Carrera del responsable"
              />

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Animal</label>
                <SuggestionSelect
                  name="animal"
                  options={availableAnimales.map((animal) => ({ value: animal, label: animal }))}
                  placeholder={
                    noAnimalesAvailable
                      ? "Ya no hay animales disponibles"
                      : "Escribe o selecciona un animal"
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  required
                  disabled={noAnimalesAvailable}
                />
              </div>

              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">
                  El equipo se identifica por el animal seleccionado.
                </p>
                {noAnimalesAvailable ? (
                  <p className="mt-2 text-sm text-amber-300">
                    Ya no hay animales disponibles para esta edicion activa.
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Responsable</label>
                <input
                  name="responsableNombre"
                  defaultValue={user.name ?? ""}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  placeholder="Nombre del jefe de grupo"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Telefono</label>
                <input
                  name="responsableTelefono"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  placeholder="Telefono del responsable"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Matricula del responsable</label>
                <input
                  name="responsableMatricula"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  placeholder="Ej. 22123456"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">
                  Grado y grupo del responsable
                </label>
                <input
                  name="responsableGradoGrupo"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  placeholder="Ej. 4A"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm text-muted-foreground">Correo del responsable</label>
                <input
                  value={user.email ?? ""}
                  readOnly
                  disabled
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-muted-foreground outline-none"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={!canRegisterTeam}
                className="btn-sheen rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Registrar equipo
              </button>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </>
  );
}
