-- Add support for non-scored events that only live in the schedule.
ALTER TABLE "Event"
  ADD COLUMN "isScored" BOOLEAN NOT NULL DEFAULT true;

-- Existing events keep their score category, but new non-scored events can omit it.
ALTER TABLE "Event"
  ALTER COLUMN "scoreCategory" DROP NOT NULL;

-- Defensive backfill to keep historical rows explicitly marked as scored.
UPDATE "Event"
SET "isScored" = true
WHERE "isScored" IS DISTINCT FROM true;

-- Enforce that scored events must always have a score category.
ALTER TABLE "Event"
  ADD CONSTRAINT "Event_score_category_consistency_check"
  CHECK ((NOT "isScored") OR ("scoreCategory" IS NOT NULL));
