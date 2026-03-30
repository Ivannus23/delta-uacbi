import { auth } from "@/auth";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { LoginButton } from "@/components/auth/LoginButton";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { SuggestionSelect } from "@/components/semana-cultural/SuggestionSelect";
import { db } from "@/lib/db";
import { getActiveEdition } from "@/lib/semana-cultural";
import { redirect } from "next/navigation";
import { createTeam } from "./actions";

const unidadesAcademicas = ["UAE", "UACBI"];

const animales = [
  "Jaguar",
  "Ocelote",
  "Capibara",
  "Perezoso de tres dedos",
  "Mono capuchino",
  "Kinkaju",
  "Coati",
  "Tapir amazonico",
  "Delfin rosado del Amazonas",
  "Guacamaya roja",
  "Tucan toco",
  "Quetzal",
  "Gallito de las rocas",
  "Colibri",
  "Loro amazonico",
  "Aguila harpia",
  "Flamenco",
  "Mariposa morpho azul",
  "Mariposa monarca",
  "Escarabajo hercules",
  "Escarabajo rinoceronte",
  "Hormiga bala",
  "Mantis religiosa",
  "Tarantula",
  "Rana dardo venenosa",
  "Rana de ojos rojos",
  "Anaconda verde",
  "Boa constrictora",
  "Iguana verde",
  "Basilisco",
  "Camaleon",
  "Tortuga charapa",
  "Caiman",
  "Okapi",
  "Cacomixtle",
  "Guacamayo azul",
];

export default async function RegistroPage() {
  const session = await auth();
  const user = session?.user;
  const edition = await getActiveEdition();
  const usedAnimals = edition
    ? await db.team.findMany({
        where: {
          editionId: edition.id,
        },
        select: {
          animal: true,
        },
      })
    : [];
  const usedAnimalSet = new Set(usedAnimals.map((team) => team.animal));
  const availableAnimales = animales.filter((animal) => !usedAnimalSet.has(animal));

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
          El jefe de grupo primero inicia sesión con Google y después completa los datos
          adicionales del equipo.
        </p>

        {!user ? (
          <section className="card-next mt-8 max-w-3xl rounded-3xl p-6 sm:p-8">
            <div className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
              Paso 1 de 2
            </div>
            <h2 className="mt-4 text-2xl font-semibold">Inicia sesión con tu cuenta institucional</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Usaremos tu cuenta de Google para identificar al jefe de grupo, vincular el equipo a
              su perfil y después pedir únicamente los datos adicionales del registro.
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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Unidad academica</label>
                <SuggestionSelect
                  name="unidadAcademica"
                  options={unidadesAcademicas.map((unidad) => ({ value: unidad, label: unidad }))}
                  placeholder="Selecciona una unidad academica"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Animal del equipo</label>
                <p className="mb-2 text-xs text-muted-foreground">
                  El nombre del equipo se asignara automaticamente con el animal que elijas.
                </p>
                {availableAnimales.length ? null : (
                  <p className="mb-2 text-xs text-amber-200">
                    Ya no hay animales disponibles para registrar en esta edicion.
                  </p>
                )}
                <SuggestionSelect
                  name="animal"
                  options={availableAnimales.map((animal) => ({ value: animal, label: animal }))}
                  placeholder="Escribe o selecciona un animal"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  required
                  disabled={!availableAnimales.length}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Color</label>
                <input
                  name="color"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  placeholder="Ej. Azul"
                  required
                />
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
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                  placeholder="Opcional"
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
                className="btn-sheen rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
                disabled={!availableAnimales.length}
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
