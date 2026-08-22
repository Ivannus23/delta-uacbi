import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getSessionUserInfo } from "@/lib/auth";
import { getTeamComposition } from "@/lib/semana-cultural-config";

export async function getActiveEdition(organizationId: string) {
  return db.culturalEdition.findFirst({
    where: { organizationId, isActive: true },
    orderBy: { year: "desc" },
  });
}

export async function resolveOrganization(orgSlug: string) {
  const organization = await db.organization.findUnique({ where: { slug: orgSlug } });
  if (!organization) notFound();

  if (organization.subscriptionStatus === "SUSPENDED") {
    const session = await auth();
    const { role: platformRole } = getSessionUserInfo(session?.user);
    if (platformRole !== "ADMIN") {
      redirect(`/semana-cultural/suspendida?org=${organization.slug}`);
    }
  }

  return organization;
}

export async function resolveOrganizationAndEdition(orgSlug: string) {
  const organization = await resolveOrganization(orgSlug);
  const edition = await getActiveEdition(organization.id);
  if (!edition) notFound();

  return { organization, edition };
}

export async function getActiveEvents(organizationId: string) {
  const edition = await getActiveEdition(organizationId);
  if (!edition) return [];

  return db.event.findMany({
    where: {
      editionId: edition.id,
      isVisible: true,
      status: {
        in: ["ABIERTA", "CERRADA", "FINALIZADA"],
      },
    },
    include: {
      scoreCategory: true,
    },
    orderBy: [{ eventDate: "asc" }, { startTime: "asc" }],
  });
}

export async function getRanking(organizationId: string) {
  const edition = await getActiveEdition(organizationId);
  if (!edition) return [];

  const teams = await db.team.findMany({
    where: { editionId: edition.id },
    orderBy: [{ totalPoints: "desc" }, { animal: "asc" }],
    select: {
      id: true,
      animal: true,
      members: {
        select: {
          academicUnitCode: true,
        },
      },
      totalPoints: true,
      status: true,
    },
  });

  return teams.map((team) => ({
    id: team.id,
    animal: team.animal,
    compositionLabel: getTeamComposition(team.members.map((member) => member.academicUnitCode)),
    totalPoints: team.totalPoints,
    status: team.status,
  }));
}
