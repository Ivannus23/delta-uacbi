-- Preflight checks for historical duplicates/inconsistencies.
-- If this migration fails, run prisma/scripts/check_semana_cultural_duplicates.sql,
-- clean conflicting records, and rerun the migration.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Team"
    GROUP BY "editionId", "responsableCorreo"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate Team responsableCorreo by edition detected.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Member" m
    JOIN "Team" t ON t.id = m."teamId"
    GROUP BY t."editionId", LOWER(TRIM(m."matricula"))
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate Member matricula by edition detected.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Member" m
    JOIN "Team" t ON t.id = m."teamId"
    GROUP BY t."editionId", LOWER(TRIM(m."institutionalEmail"))
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate Member institutionalEmail by edition detected.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "EventRegistration"
    WHERE "memberId" IS NULL
    GROUP BY "eventId", "teamId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate team registrations in the same event detected.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "EventRegistration"
    WHERE "memberId" IS NOT NULL
    GROUP BY "eventId", "memberId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate member registrations in the same event detected.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "ScoreLog"
    WHERE "eventId" IS NOT NULL AND "position" IS NOT NULL
    GROUP BY "eventId", "teamId", "position"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate score positions for event/team detected.';
  END IF;

  IF EXISTS (
    SELECT 1
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
    )
  ) THEN
    RAISE EXCEPTION 'Inconsistent EventRegistration key usage detected.';
  END IF;
END
$$;

-- Strong uniqueness directly on business keys.
CREATE UNIQUE INDEX "EventRegistration_event_team_unique_when_member_null_idx"
ON "EventRegistration"("eventId", "teamId")
WHERE "memberId" IS NULL;

CREATE UNIQUE INDEX "EventRegistration_event_member_unique_when_member_not_null_idx"
ON "EventRegistration"("eventId", "memberId")
WHERE "memberId" IS NOT NULL;

CREATE UNIQUE INDEX "ScoreLog_event_team_position_unique_idx"
ON "ScoreLog"("eventId", "teamId", "position")
WHERE "eventId" IS NOT NULL AND "position" IS NOT NULL;

-- Enforce that keys are always present and mutually exclusive according to registration type.
ALTER TABLE "EventRegistration"
ADD CONSTRAINT "EventRegistration_keys_consistency_check"
CHECK (
  (
    "memberId" IS NULL
    AND "teamRegistrationKey" IS NOT NULL
    AND "memberRegistrationKey" IS NULL
  )
  OR
  (
    "memberId" IS NOT NULL
    AND "memberRegistrationKey" IS NOT NULL
    AND "teamRegistrationKey" IS NULL
  )
);