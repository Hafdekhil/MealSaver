-- Sprint 2 existing stories: collaborative shopping list and user preferences.
ALTER TABLE "User"
ADD COLUMN "preferredIngredients" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "expirationAlertsEnabled" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "ShoppingItem" (
    "id" SERIAL NOT NULL,
    "householdId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "purchased" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" INTEGER,
    "purchasedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShoppingItem_householdId_normalizedName_key"
ON "ShoppingItem"("householdId", "normalizedName");

CREATE INDEX "ShoppingItem_householdId_purchased_idx"
ON "ShoppingItem"("householdId", "purchased");

CREATE INDEX "ShoppingItem_createdBy_idx" ON "ShoppingItem"("createdBy");
CREATE INDEX "ShoppingItem_purchasedBy_idx" ON "ShoppingItem"("purchasedBy");

ALTER TABLE "ShoppingItem"
ADD CONSTRAINT "ShoppingItem_householdId_fkey"
FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ShoppingItem"
ADD CONSTRAINT "ShoppingItem_createdBy_fkey"
FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ShoppingItem"
ADD CONSTRAINT "ShoppingItem_purchasedBy_fkey"
FOREIGN KEY ("purchasedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
