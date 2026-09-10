-- AlterTable
ALTER TABLE "FoodItem" ADD COLUMN     "addedBy" INTEGER;

-- CreateIndex
CREATE INDEX "FoodItem_addedBy_idx" ON "FoodItem"("addedBy");

-- AddForeignKey
ALTER TABLE "FoodItem" ADD CONSTRAINT "FoodItem_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
