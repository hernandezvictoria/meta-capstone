/*
  Warnings:

  - You are about to drop the column `purpose` on the `Ingredient` table. All the data in the column will be lost.
  - The `concerns` column on the `ProductInfo` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `skin_type` column on the `ProductInfo` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `concerns` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `skin_type` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `concern` to the `Ingredient` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ingredient" DROP COLUMN "purpose",
ADD COLUMN     "concern" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProductInfo" DROP COLUMN "concerns",
ADD COLUMN     "concerns" JSONB,
DROP COLUMN "skin_type",
ADD COLUMN     "skin_type" JSONB;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "concerns",
ADD COLUMN     "concerns" JSONB,
DROP COLUMN "skin_type",
ADD COLUMN     "skin_type" JSONB;
