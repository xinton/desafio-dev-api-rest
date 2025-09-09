-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "holders";

-- CreateTable
CREATE TABLE "holders"."holders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "holders_cpf_key" ON "holders"."holders"("cpf");
