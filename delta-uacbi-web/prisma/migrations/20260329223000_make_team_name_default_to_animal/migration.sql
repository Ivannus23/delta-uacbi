ALTER TABLE "Team"
ALTER COLUMN "name" SET DEFAULT '';

UPDATE "Team"
SET "name" = "animal"
WHERE BTRIM(COALESCE("name", '')) = '';

CREATE OR REPLACE FUNCTION set_team_name_from_animal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."name" IS NULL OR BTRIM(NEW."name") = '' THEN
    NEW."name" := NEW."animal";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "team_name_defaults_to_animal" ON "Team";

CREATE TRIGGER "team_name_defaults_to_animal"
BEFORE INSERT OR UPDATE ON "Team"
FOR EACH ROW
EXECUTE FUNCTION set_team_name_from_animal();
