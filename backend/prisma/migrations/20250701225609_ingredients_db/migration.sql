/*
  Warnings:

  - You are about to drop the column `concern` on the `Ingredient` table. All the data in the column will be lost.
  - Added the required column `purpose` to the `Ingredient` table without a default value. This is not possible if the table is not empty.
  - Made the column `product_type` on table `ProductInfo` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Ingredient" DROP COLUMN "concern",
ADD COLUMN     "concerns" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "purpose" TEXT NOT NULL,
ALTER COLUMN "skin_type" SET DEFAULT ARRAY[]::"SkinType"[];

-- AlterTable
ALTER TABLE "ProductInfo" ALTER COLUMN "product_type" SET NOT NULL;
