/*
  Warnings:

  - Made the column `concerns` on table `ProductInfo` required. This step will fail if there are existing NULL values in that column.
  - Made the column `skin_type` on table `ProductInfo` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ingredients` on table `ProductInfo` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `price` to the `ProductInfo` table without a default value. This is not possible if the table is not empty.
  - Made the column `product_type` on table `ProductInfo` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ProductInfo" ALTER COLUMN "concerns" SET NOT NULL,
ALTER COLUMN "skin_type" SET NOT NULL,
ALTER COLUMN "ingredients" SET NOT NULL,
DROP COLUMN "price",
ADD COLUMN     "price" DECIMAL(65,30) NOT NULL,
ALTER COLUMN "product_type" SET NOT NULL;
