/*
  Warnings:

  - The `product_type` column on the `ProductInfo` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ProductInfo" DROP COLUMN "product_type",
ADD COLUMN     "product_type" "product_type_enum";
