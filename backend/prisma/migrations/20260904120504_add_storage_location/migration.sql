-- CreateEnum
CREATE TYPE "StorageLocation" AS ENUM ('FRIDGE', 'PANTRY', 'FREEZER');

-- AlterTable
ALTER TABLE "FoodItem" ADD COLUMN     "storageLocation" "StorageLocation";
