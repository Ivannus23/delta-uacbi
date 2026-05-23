-- Add public token for safer customer-facing order URLs.
ALTER TABLE "TicketOrder"
ADD COLUMN "publicToken" TEXT;

-- Backfill existing orders with secure random tokens.
UPDATE "TicketOrder"
SET "publicToken" = lower(replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''))
WHERE "publicToken" IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "TicketOrder" WHERE "publicToken" IS NULL) THEN
    RAISE EXCEPTION 'Unable to backfill TicketOrder.publicToken for all rows';
  END IF;
END
$$;

ALTER TABLE "TicketOrder"
ALTER COLUMN "publicToken" SET NOT NULL;

CREATE UNIQUE INDEX "TicketOrder_publicToken_key"
ON "TicketOrder"("publicToken");