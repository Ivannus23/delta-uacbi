-- Preflight check: abort if there are historical duplicate responsables in the same edition.
-- If this migration fails here, run this query to inspect duplicates:
-- SELECT "editionId", "responsableCorreo", COUNT(*)
-- FROM "Team"
-- GROUP BY "editionId", "responsableCorreo"
-- HAVING COUNT(*) > 1;
--
-- Then resolve duplicates manually (merge teams or update responsableCorreo) and re-run migration.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Team"
    GROUP BY "editionId", "responsableCorreo"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add unique constraint Team(editionId,responsableCorreo): historical duplicates exist. Resolve duplicates and re-run migration.';
  END IF;
END
$$;

-- Add unique safeguard: one responsable per edition.
CREATE UNIQUE INDEX "Team_editionId_responsableCorreo_key"
ON "Team"("editionId", "responsableCorreo");