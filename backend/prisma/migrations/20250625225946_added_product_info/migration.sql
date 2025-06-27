/*
  Warnings:

  - You are about to drop the column `product_id` on the `ProductInfo` table. All the data in the column will be lost.
  - Added the required column `brand` to the `ProductInfo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ingredients` to the `ProductInfo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `ProductInfo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProductInfo" DROP COLUMN "product_id",
ADD COLUMN     "brand" TEXT NOT NULL,
ADD COLUMN     "ingredients" JSONB NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;
