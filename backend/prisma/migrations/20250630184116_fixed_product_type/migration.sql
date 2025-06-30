-- AlterTable
-- ALTER TABLE "ProductInfo" ALTER COLUMN "product_type" TYPE "ProductType" USING "product_type"::"ProductType",
-- ALTER COLUMN "product_type" SET DATA TYPE "ProductType";

ALTER TABLE "ProductInfo"
ALTER COLUMN "product_type" TYPE "ProductType"
USING "product_type"[1];
