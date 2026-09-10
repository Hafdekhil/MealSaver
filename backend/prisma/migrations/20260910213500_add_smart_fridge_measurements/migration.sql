-- CreateTable
CREATE TABLE "SmartFridgeMeasurement" (
    "id" SERIAL NOT NULL,
    "householdId" INTEGER NOT NULL,
    "sourceId" TEXT NOT NULL,
    "temperatureC" DOUBLE PRECISION NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmartFridgeMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SmartFridgeMeasurement_householdId_measuredAt_idx"
ON "SmartFridgeMeasurement"("householdId", "measuredAt");

-- CreateIndex
CREATE INDEX "SmartFridgeMeasurement_sourceId_idx"
ON "SmartFridgeMeasurement"("sourceId");

-- AddForeignKey
ALTER TABLE "SmartFridgeMeasurement"
ADD CONSTRAINT "SmartFridgeMeasurement_householdId_fkey"
FOREIGN KEY ("householdId") REFERENCES "Household"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
