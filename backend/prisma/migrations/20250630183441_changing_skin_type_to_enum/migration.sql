/*
  Warnings:

  - The `skin_type` column on the `Ingredient` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `skin_type` column on the `ProductInfo` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `product_type` column on the `ProductInfo` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `skin_type` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('serum', 'toner', 'sunscreen', 'moisturizer', 'retinol', 'mask', 'cleanser', 'eye_cream');

-- CreateEnum
CREATE TYPE "SkinType" AS ENUM ('normal', 'dry', 'combination', 'oily');

-- AlterTable
ALTER TABLE "Ingredient" DROP COLUMN "skin_type",
ADD COLUMN     "skin_type" "SkinType"[];

-- AlterTable
ALTER TABLE "ProductInfo" DROP COLUMN "skin_type",
ADD COLUMN     "skin_type" "SkinType"[],
DROP COLUMN "product_type",
ADD COLUMN     "product_type" "ProductType"[];

-- AlterTable
ALTER TABLE "User" DROP COLUMN "skin_type",
ADD COLUMN     "skin_type" "SkinType"[] DEFAULT ARRAY[]::"SkinType"[];

-- DropEnum
DROP TYPE "product_type_enum";
