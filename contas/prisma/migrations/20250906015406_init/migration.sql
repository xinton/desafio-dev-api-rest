-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "accounts";

-- CreateEnum
CREATE TYPE "accounts"."TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAW');

-- CreateTable
CREATE TABLE "accounts"."accounts" (
    "id" TEXT NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "number" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "holder_cpf" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts"."transactions" (
    "id" TEXT NOT NULL,
    "type" "accounts"."TransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_number_key" ON "accounts"."accounts"("number");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_holder_cpf_key" ON "accounts"."accounts"("holder_cpf");

-- AddForeignKey
ALTER TABLE "accounts"."transactions" ADD CONSTRAINT "transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"."accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
