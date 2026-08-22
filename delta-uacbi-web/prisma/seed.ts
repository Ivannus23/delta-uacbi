import { PrismaClient, EventStatus, EventType, ScorePosition } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL no está definida");

const adapter = new PrismaPg({ connectionString });
const db = new PrismaClient({ adapter });

const TEAM_NAMES = [
  "Águila", "Jaguar", "Lobo", "Pantera", "Tigre", "León",
  "Cóndor", "Halcón", "Búho", "Zorro", "Puma", "Delfín",
  "Tiburón", "Oso", "Lince", "Coyote", "Gorila", "Rinoceronte",
  "Elefante", "Cocodrilo", "Serpiente", "Escorpión", "Avispa", "Pingüino",
  "Flamenco", "Colibrí", "Quetzal", "Iguana", "Camaleón", "Tortuga",
  "Cebra", "Jirafa", "Búfalo", "Venado", "Armadillo", "Mapache",
];

const SCORE_CATEGORIES = [
  { code: "TOPACIO", label: "Topacio", colorHex: "#fbbf24", order: 0 },
  { code: "DIAMANTE", label: "Diamante", colorHex: "#38bdf8", order: 1 },
  { code: "ESMERALDA", label: "Esmeralda", colorHex: "#34d399", order: 2 },
];

async function main() {
  const organization = await db.organization.upsert({
    where: { slug: "uacbi" },
    update: { name: "UACBI × UAE" },
    create: { slug: "uacbi", name: "UACBI × UAE" },
  });

  const carnavalTheme = {
    themeName: "Carnaval Brasileño",
    subtitle: "Registro de equipos, actividades, ranking y resultados en vivo.",
    eventLogoUrl: "/CARNAVAL_1.svg",
    partnerLogos: [
      { url: "/PAECOLOR.svg", alt: "Proyecto P.A.E" },
      { url: "/DELTACOLOR_1.svg", alt: "Delta UACBI" },
    ],
    organizingUnitCodes: ["UACBI", "UAE"],
  };

  const edition = await db.culturalEdition.upsert({
    where: { organizationId_year: { organizationId: organization.id, year: 2026 } },
    update: {
      name: "Semana Cultural UAE × UACBI 2026",
      slug: "2026",
      startDate: new Date("2026-05-18T08:00:00.000Z"),
      endDate: new Date("2026-05-22T19:00:00.000Z"),
      isActive: true,
      ...carnavalTheme,
    },
    create: {
      organizationId: organization.id,
      name: "Semana Cultural UAE × UACBI 2026",
      slug: "2026",
      year: 2026,
      startDate: new Date("2026-05-18T08:00:00.000Z"),
      endDate: new Date("2026-05-22T19:00:00.000Z"),
      isActive: true,
      ...carnavalTheme,
    },
  });

  // --- Catálogo: nombres de equipo ---------------------------------------

  for (const [index, name] of TEAM_NAMES.entries()) {
    await db.teamNameOption.upsert({
      where: { editionId_name: { editionId: edition.id, name } },
      update: { order: index },
      create: { editionId: edition.id, name, order: index },
    });
  }

  // --- Catálogo: categorías de puntaje -------------------------------------

  const scoreCategoriesByCode = new Map<string, { id: string }>();
  for (const category of SCORE_CATEGORIES) {
    const record = await db.scoreCategoryDef.upsert({
      where: { editionId_code: { editionId: edition.id, code: category.code } },
      update: { label: category.label, colorHex: category.colorHex, order: category.order },
      create: {
        editionId: edition.id,
        code: category.code,
        label: category.label,
        colorHex: category.colorHex,
        order: category.order,
      },
      select: { id: true },
    });
    scoreCategoriesByCode.set(category.code, record);
  }

  // Las unidades academicas y carreras ya no se siembran aqui: son un catalogo
  // global fijo definido en lib/academic-catalog.ts, compartido por toda la
  // plataforma en vez de configurarse por edicion.

  // --- Reglas de puntuación -------------------------------------------------

  const rules = [
    { category: "TOPACIO", position: ScorePosition.PRIMER_LUGAR, points: 1000 },
    { category: "TOPACIO", position: ScorePosition.SEGUNDO_LUGAR, points: 700 },
    { category: "TOPACIO", position: ScorePosition.TERCER_LUGAR, points: 500 },
    { category: "TOPACIO", position: ScorePosition.PARTICIPACION, points: 200 },
    { category: "TOPACIO", position: ScorePosition.PENALIZACION, points: -360 },

    { category: "DIAMANTE", position: ScorePosition.PRIMER_LUGAR, points: 4000 },
    { category: "DIAMANTE", position: ScorePosition.SEGUNDO_LUGAR, points: 2800 },
    { category: "DIAMANTE", position: ScorePosition.TERCER_LUGAR, points: 2000 },
    { category: "DIAMANTE", position: ScorePosition.PARTICIPACION, points: 800 },
    { category: "DIAMANTE", position: ScorePosition.PENALIZACION, points: -360 },

    { category: "ESMERALDA", position: ScorePosition.PRIMER_LUGAR, points: 2000 },
    { category: "ESMERALDA", position: ScorePosition.SEGUNDO_LUGAR, points: 1400 },
    { category: "ESMERALDA", position: ScorePosition.TERCER_LUGAR, points: 1000 },
    { category: "ESMERALDA", position: ScorePosition.PARTICIPACION, points: 400 },
    { category: "ESMERALDA", position: ScorePosition.PENALIZACION, points: -360 },
  ];

  for (const rule of rules) {
    const scoreCategory = scoreCategoriesByCode.get(rule.category);
    if (!scoreCategory) continue;

    await db.scoreRule.upsert({
      where: {
        editionId_scoreCategoryId_position: {
          editionId: edition.id,
          scoreCategoryId: scoreCategory.id,
          position: rule.position,
        },
      },
      update: { points: rule.points },
      create: {
        editionId: edition.id,
        scoreCategoryId: scoreCategory.id,
        position: rule.position,
        points: rule.points,
      },
    });
  }

  // --- Actividades ------------------------------------------------------

  const events = [
    {
      name: "Inauguración",
      slug: "inauguracion",
      type: EventType.CULTURAL,
      isScored: true,
      scoreCategory: "TOPACIO",
      place: "Módulo 7 de Futbol",
      eventDate: new Date("2026-05-18T08:00:00.000Z"),
      description: "Apertura oficial de la Semana Cultural.",
    },
    {
      name: "Presentación de equipos",
      slug: "presentacion-de-equipos",
      type: EventType.CULTURAL,
      isScored: true,
      scoreCategory: "TOPACIO",
      place: "Módulo 7 de Futbol",
      eventDate: new Date("2026-05-18T09:00:00.000Z"),
      description: "Desfile y presentación de equipos.",
    },
    {
      name: "Carrera de botargas",
      slug: "carrera-de-botargas",
      type: EventType.RECREATIVA,
      isScored: true,
      scoreCategory: "TOPACIO",
      place: "Módulo 7 de Futbol",
      eventDate: new Date("2026-05-18T10:00:00.000Z"),
      description: "Competencia recreativa entre equipos.",
    },
    {
      name: "Torneo de Futbol",
      slug: "torneo-de-futbol",
      type: EventType.DEPORTIVA,
      isScored: true,
      scoreCategory: "DIAMANTE",
      place: "Módulo 1 de futbol rápido",
      eventDate: new Date("2026-05-19T09:00:00.000Z"),
      description: "Torneo deportivo de futbol.",
    },
    {
      name: "Torneo de Voleibol",
      slug: "torneo-de-voleibol",
      type: EventType.DEPORTIVA,
      isScored: true,
      scoreCategory: "DIAMANTE",
      place: "Módulos azules de sociales",
      eventDate: new Date("2026-05-19T09:00:00.000Z"),
      description: "Torneo deportivo de voleibol.",
    },
    {
      name: "Conferencia magistral",
      slug: "conferencia-magistral",
      type: EventType.ACADEMICA,
      isScored: false,
      scoreCategory: null,
      place: "Auditorio principal",
      eventDate: new Date("2026-05-19T16:00:00.000Z"),
      description: "Actividad de cronograma sin asignación de puntos.",
    },
    {
      name: "Caravana UAE/UACBI",
      slug: "caravana-uae-uacbi",
      type: EventType.CULTURAL,
      isScored: true,
      scoreCategory: "ESMERALDA",
      place: "Ruta de caravana",
      eventDate: new Date("2026-05-20T11:00:00.000Z"),
      description: "Caravana conjunta UAE × UACBI.",
    },
    {
      name: "Rally UAE/UACBI",
      slug: "rally-uae-uacbi",
      type: EventType.RECREATIVA,
      isScored: true,
      scoreCategory: "ESMERALDA",
      place: "Campus Universitario",
      eventDate: new Date("2026-05-21T09:00:00.000Z"),
      description: "Rally por equipos en campus.",
    },
    {
      name: "Torneo de Videojuegos",
      slug: "torneo-de-videojuegos",
      type: EventType.VIDEOJUEGO,
      isScored: true,
      scoreCategory: "ESMERALDA",
      place: "Aulas de la UAE",
      eventDate: new Date("2026-05-21T14:00:00.000Z"),
      description: "Clash Royale, Smash Bros, Mario Kart, FIFA, KOF.",
    },
    {
      name: "Torneo de Box",
      slug: "torneo-de-box",
      type: EventType.DEPORTIVA,
      isScored: true,
      scoreCategory: "DIAMANTE",
      place: "Cancha de la Unidad Académica de Enfermería",
      eventDate: new Date("2026-05-22T09:00:00.000Z"),
      description: "Competencia deportiva de box.",
    },
    {
      name: "Concurso de baile",
      slug: "concurso-de-baile",
      type: EventType.CULTURAL,
      isScored: true,
      scoreCategory: "ESMERALDA",
      place: "Cancha de la Unidad Académica de Enfermería",
      eventDate: new Date("2026-05-22T14:00:00.000Z"),
      description: "Concurso de baile entre equipos.",
    },
  ];

  for (const event of events) {
    const scoreCategoryId = event.scoreCategory ? scoreCategoriesByCode.get(event.scoreCategory)?.id ?? null : null;

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
        isScored: event.isScored,
        scoreCategoryId,
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
        isScored: event.isScored,
        scoreCategoryId,
        place: event.place,
        eventDate: event.eventDate,
        description: event.description,
        status: EventStatus.ABIERTA,
        isVisible: true,
      },
    });
  }

  console.log(`✅ Seed completado — organizacion "${organization.slug}", edicion "${edition.slug}"`);
  console.log(`   Nombres de equipo: ${TEAM_NAMES.length}`);
  console.log(`   Categorías de puntaje: ${scoreCategoriesByCode.size}`);
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
