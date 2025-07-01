/*
  Warnings:

  - The `concerns` column on the `ProductInfo` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `skin_type` column on the `ProductInfo` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `ingredients` column on the `ProductInfo` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ProductInfo" DROP COLUMN "concerns",
ADD COLUMN     "concerns" TEXT[],
DROP COLUMN "skin_type",
ADD COLUMN     "skin_type" TEXT[],
DROP COLUMN "ingredients",
ADD COLUMN     "ingredients" TEXT[];
