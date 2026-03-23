import { auth } from "@/auth";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { RegistroResponsableEmailField } from "@/components/semana-cultural/RegistroResponsableEmailField";
import { createTeam } from "./actions";

export default async function RegistroPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana />

        <h1 className="text-3xl font-semibold">Registro de equipos</h1>
        <p className="mt-2 text-muted-foreground">
          Completa los datos del equipo y del responsable para registrarlo en la Semana Cultural.
        </p>

        {!user ? (
          <div className="mt-6 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5">
            <p className="text-sm text-amber-50">
              Si el jefe de grupo inicia sesion con Google antes de registrar el equipo, el equipo
              quedara vinculado automaticamente a su cuenta.
            </p>
          </div>
        ) : null}

        <form action={createTeam} className="mt-8 card-next rounded-3xl p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Unidad academica</label>
              <input
                name="unidadAcademica"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                placeholder="UACBI / UAE"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Nombre del equipo</label>
              <input
                name="name"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                placeholder="Ej. Titanes"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Animal</label>
              <input
                name="animal"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                placeholder="Ej. Jaguar"
                required
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
                defaultValue={user?.name ?? ""}
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

            <RegistroResponsableEmailField
              defaultValue={user?.email ?? ""}
              isAuthenticated={Boolean(user)}
            />
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className="btn-sheen rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
            >
              Registrar equipo
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </>
  );
}
