/*
  Warnings:

  - Made the column `product_type` on table `ProductInfo` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ProductInfo" ALTER COLUMN "product_type" SET NOT NULL;
