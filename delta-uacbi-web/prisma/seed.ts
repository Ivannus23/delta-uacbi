import { PrismaClient, EventStatus, EventType, ScoreCategory, ScorePosition } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL no está definida");

const adapter = new PrismaPg({ connectionString });
const db = new PrismaClient({ adapter });

async function main() {
  const edition = await db.culturalEdition.upsert({
    where: { year: 2026 },
    update: {
      name: "Semana Cultural UAE × UACBI 2026",
      startDate: new Date("2026-05-18T08:00:00.000Z"),
      endDate: new Date("2026-05-22T19:00:00.000Z"),
      isActive: true,
    },
    create: {
      name: "Semana Cultural UAE × UACBI 2026",
      year: 2026,
      startDate: new Date("2026-05-18T08:00:00.000Z"),
      endDate: new Date("2026-05-22T19:00:00.000Z"),
      isActive: true,
    },
  });

  await db.culturalEdition.updateMany({
    where: { id: { not: edition.id } },
    data: { isActive: false },
  });

  const rules = [
    { category: ScoreCategory.TOPACIO, position: ScorePosition.PRIMER_LUGAR, points: 1000 },
    { category: ScoreCategory.TOPACIO, position: ScorePosition.SEGUNDO_LUGAR, points: 700 },
    { category: ScoreCategory.TOPACIO, position: ScorePosition.TERCER_LUGAR, points: 500 },
    { category: ScoreCategory.TOPACIO, position: ScorePosition.PARTICIPACION, points: 200 },
    { category: ScoreCategory.TOPACIO, position: ScorePosition.PENALIZACION, points: -360 },

    { category: ScoreCategory.DIAMANTE, position: ScorePosition.PRIMER_LUGAR, points: 4000 },
    { category: ScoreCategory.DIAMANTE, position: ScorePosition.SEGUNDO_LUGAR, points: 2800 },
    { category: ScoreCategory.DIAMANTE, position: ScorePosition.TERCER_LUGAR, points: 2000 },
    { category: ScoreCategory.DIAMANTE, position: ScorePosition.PARTICIPACION, points: 800 },
    { category: ScoreCategory.DIAMANTE, position: ScorePosition.PENALIZACION, points: -360 },

    { category: ScoreCategory.ESMERALDA, position: ScorePosition.PRIMER_LUGAR, points: 2000 },
    { category: ScoreCategory.ESMERALDA, position: ScorePosition.SEGUNDO_LUGAR, points: 1400 },
    { category: ScoreCategory.ESMERALDA, position: ScorePosition.TERCER_LUGAR, points: 1000 },
    { category: ScoreCategory.ESMERALDA, position: ScorePosition.PARTICIPACION, points: 400 },
    { category: ScoreCategory.ESMERALDA, position: ScorePosition.PENALIZACION, points: -360 },
  ];

  for (const rule of rules) {
    await db.scoreRule.upsert({
      where: {
        editionId_category_position: {
          editionId: edition.id,
          category: rule.category,
          position: rule.position,
        },
      },
      update: { points: rule.points },
      create: {
        editionId: edition.id,
        category: rule.category,
        position: rule.position,
        points: rule.points,
      },
    });
  }

  const events = [
    {
      name: "Inauguración",
      slug: "inauguracion",
      type: EventType.CULTURAL,
      scoreCategory: ScoreCategory.TOPACIO,
      place: "Módulo 7 de Futbol",
      eventDate: new Date("2026-05-18T08:00:00.000Z"),
      description: "Apertura oficial de la Semana Cultural.",
    },
    {
      name: "Presentación de equipos",
      slug: "presentacion-de-equipos",
      type: EventType.CULTURAL,
      scoreCategory: ScoreCategory.TOPACIO,
      place: "Módulo 7 de Futbol",
      eventDate: new Date("2026-05-18T09:00:00.000Z"),
      description: "Desfile y presentación de equipos.",
    },
    {
      name: "Carrera de botargas",
      slug: "carrera-de-botargas",
      type: EventType.RECREATIVA,
      scoreCategory: ScoreCategory.TOPACIO,
      place: "Módulo 7 de Futbol",
      eventDate: new Date("2026-05-18T10:00:00.000Z"),
      description: "Competencia recreativa entre equipos.",
    },
    {
      name: "Torneo de Futbol",
      slug: "torneo-de-futbol",
      type: EventType.DEPORTIVA,
      scoreCategory: ScoreCategory.DIAMANTE,
      place: "Módulo 1 de futbol rápido",
      eventDate: new Date("2026-05-19T09:00:00.000Z"),
      description: "Torneo deportivo de futbol.",
    },
    {
      name: "Torneo de Voleibol",
      slug: "torneo-de-voleibol",
      type: EventType.DEPORTIVA,
      scoreCategory: ScoreCategory.DIAMANTE,
      place: "Módulos azules de sociales",
      eventDate: new Date("2026-05-19T09:00:00.000Z"),
      description: "Torneo deportivo de voleibol.",
    },
    {
      name: "Caravana UAE/UACBI",
      slug: "caravana-uae-uacbi",
      type: EventType.CULTURAL,
      scoreCategory: ScoreCategory.ESMERALDA,
      place: "Ruta de caravana",
      eventDate: new Date("2026-05-20T11:00:00.000Z"),
      description: "Caravana conjunta UAE × UACBI.",
    },
    {
      name: "Rally UAE/UACBI",
      slug: "rally-uae-uacbi",
      type: EventType.RECREATIVA,
      scoreCategory: ScoreCategory.ESMERALDA,
      place: "Campus Universitario",
      eventDate: new Date("2026-05-21T09:00:00.000Z"),
      description: "Rally por equipos en campus.",
    },
    {
      name: "Torneo de Videojuegos",
      slug: "torneo-de-videojuegos",
      type: EventType.VIDEOJUEGO,
      scoreCategory: ScoreCategory.ESMERALDA,
      place: "Aulas de la UAE",
      eventDate: new Date("2026-05-21T14:00:00.000Z"),
      description: "Clash Royale, Smash Bros, Mario Kart, FIFA, KOF.",
    },
    {
      name: "Torneo de Box",
      slug: "torneo-de-box",
      type: EventType.DEPORTIVA,
      scoreCategory: ScoreCategory.DIAMANTE,
      place: "Cancha de la Unidad Académica de Enfermería",
      eventDate: new Date("2026-05-22T09:00:00.000Z"),
      description: "Competencia deportiva de box.",
    },
    {
      name: "Concurso de baile",
      slug: "concurso-de-baile",
      type: EventType.CULTURAL,
      scoreCategory: ScoreCategory.ESMERALDA,
      place: "Cancha de la Unidad Académica de Enfermería",
      eventDate: new Date("2026-05-22T14:00:00.000Z"),
      description: "Concurso de baile entre equipos.",
    },
  ];

  for (const event of events) {
    await db.event.upsert({
      where: {
        editionId_slug: {
          editionId: edition.id,
          slug: event.slug,
        },
      },
      update: {
        name: event.name,
        type: event.type,
        scoreCategory: event.scoreCategory,
        place: event.place,
        eventDate: event.eventDate,
        description: event.description,
        status: EventStatus.ABIERTA,
        isVisible: true,
      },
      create: {
        editionId: edition.id,
        name: event.name,
        slug: event.slug,
        type: event.type,
        scoreCategory: event.scoreCategory,
        place: event.place,
        eventDate: event.eventDate,
        description: event.description,
        status: EventStatus.ABIERTA,
        isVisible: true,
      },
    });
  }

  console.log("✅ Seed completado");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
