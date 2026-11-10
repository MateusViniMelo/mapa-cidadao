ALTER TABLE "access_tokens" ADD COLUMN "expires_at" TIMESTAMPTZ(6);

UPDATE "access_tokens"
SET "expires_at" = "created_at" + INTERVAL '7 days'
WHERE "expires_at" IS NULL;

ALTER TABLE "access_tokens"
ALTER COLUMN "expires_at" SET DEFAULT (NOW() + INTERVAL '7 days');

ALTER TABLE "access_tokens"
ALTER COLUMN "expires_at" SET NOT NULL;
