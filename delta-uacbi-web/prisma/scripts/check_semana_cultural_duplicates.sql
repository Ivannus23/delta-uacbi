-- Semana Cultural duplicate/integrity diagnostics
-- Run before applying constraints on production/staging data.

-- 1) Responsable duplicado por edición
SELECT "editionId", "responsableCorreo", COUNT(*) AS total
FROM "Team"
GROUP BY "editionId", "responsableCorreo"
HAVING COUNT(*) > 1;

-- 2) Matrícula duplicada por edición
SELECT t."editionId", LOWER(TRIM(m."matricula")) AS matricula_normalizada, COUNT(*) AS total
FROM "Member" m
JOIN "Team" t ON t.id = m."teamId"
GROUP BY t."editionId", LOWER(TRIM(m."matricula"))
HAVING COUNT(*) > 1;

-- 3) Correo institucional duplicado por edición
SELECT t."editionId", LOWER(TRIM(m."institutionalEmail")) AS correo_normalizado, COUNT(*) AS total
FROM "Member" m
JOIN "Team" t ON t.id = m."teamId"
GROUP BY t."editionId", LOWER(TRIM(m."institutionalEmail"))
HAVING COUNT(*) > 1;

-- 4) Equipo duplicado en el mismo evento (registro por equipo)
SELECT "eventId", "teamId", COUNT(*) AS total
FROM "EventRegistration"
WHERE "memberId" IS NULL
GROUP BY "eventId", "teamId"
HAVING COUNT(*) > 1;

-- 5) Integrante duplicado en el mismo evento
SELECT "eventId", "memberId", COUNT(*) AS total
FROM "EventRegistration"
WHERE "memberId" IS NOT NULL
GROUP BY "eventId", "memberId"
HAVING COUNT(*) > 1;

-- 6) Puntos duplicados por evento/equipo/posición
SELECT "eventId", "teamId", "position", COUNT(*) AS total
FROM "ScoreLog"
WHERE "eventId" IS NOT NULL AND "position" IS NOT NULL
GROUP BY "eventId", "teamId", "position"
HAVING COUNT(*) > 1;

-- 7) Inconsistencias de llaves de registro de evento
SELECT id, "eventId", "teamId", "memberId", "teamRegistrationKey", "memberRegistrationKey"
FROM "EventRegistration"
WHERE (
  "memberId" IS NULL
  AND (
    "teamRegistrationKey" IS NULL
    OR "memberRegistrationKey" IS NOT NULL
  )
)
OR (
  "memberId" IS NOT NULL
  AND (
    "memberRegistrationKey" IS NULL
    OR "teamRegistrationKey" IS NOT NULL
  )
);

-- Remediación sugerida:
-- - Resolver duplicados conservando 1 registro canónico por grupo.
-- - Ajustar datos de responsables/correos/matrículas con conflicto.
-- - Limpiar registros de evento o score repetidos.
-- - Reintentar migración después de dejar todas las consultas en 0 filas.