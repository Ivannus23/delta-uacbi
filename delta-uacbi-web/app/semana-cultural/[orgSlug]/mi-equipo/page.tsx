import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";
import { getSessionUserInfo, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTeamComposition } from "@/lib/semana-cultural-config";
import { resolveOrganization, getActiveEdition } from "@/lib/semana-cultural";

export default async function MiEquipoPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const organization = await resolveOrganization(orgSlug);

  const session = await requireUser();
  const { id: userId } = getSessionUserInfo(session.user);

  if (!userId) {
    return (
      <>
        <Navbar />
        <main className="container py-10">
          <HeaderSemana orgSlug={orgSlug} />
          <p className="text-muted-foreground">No se pudo identificar el usuario autenticado.</p>
        </main>
        <Footer />
      </>
    );
  }

  const edition = await getActiveEdition(organization.id);
  if (!edition) {
    return (
      <>
        <Navbar />
        <main className="container py-10">
          <HeaderSemana orgSlug={orgSlug} />
          <p>No hay edicion activa.</p>
        </main>
        <Footer />
      </>
    );
  }

  const team = await db.team.findFirst({
    where: {
      editionId: edition.id,
      leaderId: userId,
    },
    include: {
      members: {
        select: {
          academicUnitCode: true,
        },
      },
    },
  });

  if (!team) {
    return (
      <>
        <Navbar />
        <main className="container py-10">
          <HeaderSemana orgSlug={orgSlug} edition={edition} />
          <p className="text-muted-foreground">No tienes un equipo asignado todavia.</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana orgSlug={orgSlug} edition={edition} />

        <section className="card-next rounded-3xl p-6">
          <h2 className="text-3xl font-semibold">{team.animal}</h2>
          <p className="mt-2 text-muted-foreground">
            {getTeamComposition(team.members.map((member) => member.academicUnitCode))}
          </p>

          <div className="mt-6">
            <Link
              href={`/semana-cultural/${orgSlug}/equipos/${team.id}`}
              className="btn-sheen rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Administrar mi equipo
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
