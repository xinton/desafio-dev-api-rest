/*
  Warnings:

  - The values [WITHDRAW] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "accounts"."TransactionType_new" AS ENUM ('DEPOSIT', 'WITHDRAWAL');
ALTER TABLE "accounts"."transactions" ALTER COLUMN "type" TYPE "accounts"."TransactionType_new" USING ("type"::text::"accounts"."TransactionType_new");
ALTER TYPE "accounts"."TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "accounts"."TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "accounts"."TransactionType_old";
COMMIT;
