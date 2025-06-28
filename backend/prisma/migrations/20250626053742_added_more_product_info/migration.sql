-- AlterTable
ALTER TABLE "ProductInfo" ADD COLUMN     "price" TEXT,
ADD COLUMN     "product_type" TEXT,
ALTER COLUMN "ingredients" DROP NOT NULL;
