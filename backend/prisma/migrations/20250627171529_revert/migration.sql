/*
  Warnings:

  - Made the column `price` on table `ProductInfo` required. This step will fail if there are existing NULL values in that column.
  - Made the column `product_type` on table `ProductInfo` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "product_type_enum" AS ENUM ('serum', 'toner', 'sunscreen', 'moisturizer', 'retinol', 'mask', 'cleanser', 'eye_cream');

-- AlterTable
ALTER TABLE "ProductInfo" ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "product_type" SET NOT NULL;
